const express = require("express");
const User = require("../models/Users");
const router = express.Router();
// Middleware kiểm tra header
function checkAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || authHeader !== `Bearer ${process.env.API_SECRET}`) {
    return res.status(403).json({ error: "Forbidden: Invalid token" });
  }
  next();
}
// Lấy danh sách user
router.get("/", checkAuth, async (req, res) => {
  const users = await User.find();
  res.json(users);
});
// Xếp hạng theo điểm và thời gian
router.get("/rank", checkAuth, async (req, res) => {
  try {
    const users = await User.find().sort({ traloidung: -1, thoigianlambai: 1 });
    // -1: điểm cao nhất trước
    //  1: thời gian ít nhất trước (nhanh hơn)

    res.json(users);
  } catch (err) {
    console.error("❌ Lỗi tại /users/rank:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
// GET /users?donvi=Phòng 1
router.get("/sort", checkAuth, async (req, res) => {
  try {
    const { donvi } = req.query;
    let query = {};

    if (donvi) {
      query.donvi = donvi; // lọc theo đơn vị nếu có
    }

    const users = await User.find(query).sort({ donvi: 1 });
    res.json(users);
  } catch (err) {
    console.error("❌ Lỗi lấy users:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/:id", checkAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server", error: err });
  }
});

router.post("/", async (req, res) => {
  try {
    let { hoten, donvi, phone } = req.body;

    // 1️⃣ Chuẩn hóa Unicode dựng sẵn (NFC) và cắt khoảng trắng thừa
    // Giúp đồng nhất bộ gõ tiếng Việt từ bàn phím iOS/Android (NFD) và PC (NFC)
    const normalizedHoten = (hoten || "").normalize("NFC").trim();
    const normalizedDonvi = (donvi || "").normalize("NFC").trim();
    const normalizedPhone = (phone || "").normalize("NFC").trim();

    // 2️⃣ Kiểm tra dữ liệu bắt buộc
    if (!normalizedHoten || !normalizedDonvi || !normalizedPhone) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin!" });
    }

    // 3️⃣ Đếm số lần xuất hiện trong Database
    // Collation { locale: "vi", strength: 2 } tự động bỏ qua hoa/thường theo chuẩn tiếng Việt
    const count = await User.countDocuments({ hoten: normalizedHoten })
      .collation({ locale: "vi", strength: 2 });

    console.log("🧩 Check user:", normalizedHoten, "=>", count, "lần");

    // Giới hạn số lần cho phép (ví dụ: tối đa 2 lần)
    if (count >= 2) {
      return res.status(400).json({
        error: "Họ tên này đã xuất hiện quá số lần cho phép!",
      });
    }

    // 4️⃣ Lưu bản ghi mới vào Database (dữ liệu đã chuẩn hóa)
    const newUser = await User.create({
      hoten: normalizedHoten,
      donvi: normalizedDonvi,
      phone: normalizedPhone,
    });

    return res.status(201).json({
      message: "Thêm thông tin thành công!",
      data: newUser,
    });
  } catch (error) {
    console.error("❌ Lỗi xử lý user:", error);
    return res.status(500).json({ error: "Đã xảy ra lỗi trên hệ thống!" });
  }
});

    // 5️⃣ Trả về user mới
    res.json(newUser);
  } catch (err) {
    console.error("🔥 Lỗi xử lý đăng nhập:", err);
    res.status(500).json({ error: "Có lỗi xảy ra, vui lòng thử lại!" });
  }
});

// Sửa user
router.put("/:id", checkAuth, async (req, res) => {
  try {
    const { id } = req.params; // lấy id từ URL
    const updateData = req.body; // dữ liệu gửi lên để update

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true, // trả về document đã update
      runValidators: true, // chạy validate trong schema
    });

    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    res.json(user); // trả về user sau khi update
  } catch (error) {
    res.status(400).json({ error: err.message });
  }
});

//xóa all
router.delete("/all", checkAuth, async (req, res) => {
  try {
    const result = await User.deleteMany({});
    res.status(200).json({
      message: "Đã xoá tất cả user",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("❌ Lỗi khi xoá all users:", err);
    res.status(500).json({ message: err.message });
  }
});
router.delete("/:id", checkAuth, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User không tồn tại" });
    }
    res.json({ message: "Xóa user thành công", user: deletedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server", error: err });
  }
});
module.exports = router;
