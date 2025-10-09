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
    const { hoten, donvi, phone } = req.body;

    // 1️⃣ Kiểm tra nhập đủ thông tin
    if (!hoten?.trim() || !donvi?.trim() || !phone?.trim()) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin!" });
    }

    // 2️⃣ Chuẩn hóa dữ liệu
    const normalizedHoten = hoten.trim();
    const normalizedPhone = phone.trim();

    // 🧩 Escape tên để tránh lỗi regex
    const escapedHoten = normalizedHoten.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // 3️⃣ Kiểm tra xem họ tên đã tồn tại (không phân biệt hoa/thường)
    const count = await User.countDocuments({
      hoten: { $regex: new RegExp(`^${escapedHoten}$`, "i") },
    });

    console.log("🧩 Check user:", normalizedHoten, "=>", count, "lần");

    if (count >= 1) {
      return res
        .status(400)
        .json({ error: "Họ tên này đã xuất hiện quá 2 lần!" });
    }

    // 4️⃣ Nếu chưa vượt quá -> tạo user mới
    const newUser = await User.create({
      hoten: normalizedHoten,
      donvi: donvi.trim(),
      phone: normalizedPhone,
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
