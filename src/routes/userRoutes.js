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

// 🛠️ Hàm làm sạch sâu ký tự tàng hình và chuẩn hóa Unicode dựng sẵn (NFC)
function cleanInput(str) {
  if (!str || typeof str !== "string") return "";
  return (
    str
      .normalize("NFC")
      // Xóa ký tự tàng hình, zero-width space, BOM trên mobile
      .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u00AD]/g, "")
      // Đổi non-breaking space thành space thường
      .replace(/\u00A0/g, " ")
      // Gộp nhiều dấu cách liền nhau thành 1
      .replace(/\s+/g, " ")
      .trim()
  );
}

// 🛠️ Hàm đồng nhất vị trí bỏ dấu kiểu mới/cũ (Thuý/Thúy, Hoà/Hòa)
function standardizeVietnameseAccent(str) {
  if (!str) return "";
  return str
    .replace(/uý/gi, (m) => (m[0] === m[0].toUpperCase() ? "Úy" : "úy"))
    .replace(/uỳ/gi, (m) => (m[0] === m[0].toUpperCase() ? "Ùy" : "ùy"))
    .replace(/uỷ/gi, (m) => (m[0] === m[0].toUpperCase() ? "Ủy" : "ủy"))
    .replace(/uỹ/gi, (m) => (m[0] === m[0].toUpperCase() ? "Ũy" : "ũy"))
    .replace(/uỵ/gi, (m) => (m[0] === m[0].toUpperCase() ? "Ụy" : "ụy"))
    .replace(/oà/gi, (m) => (m[0] === m[0].toUpperCase() ? "Òa" : "òa"))
    .replace(/oá/gi, (m) => (m[0] === m[0].toUpperCase() ? "Óa" : "óa"))
    .replace(/oả/gi, (m) => (m[0] === m[0].toUpperCase() ? "Ỏa" : "ỏa"))
    .replace(/oã/gi, (m) => (m[0] === m[0].toUpperCase() ? "Õa" : "õa"))
    .replace(/oạ/gi, (m) => (m[0] === m[0].toUpperCase() ? "Ọa" : "ọa"))
    .replace(/oè/gi, (m) => (m[0] === m[0].toUpperCase() ? "Òe" : "òe"))
    .replace(/oé/gi, (m) => (m[0] === m[0].toUpperCase() ? "Óe" : "óe"))
    .replace(/oẻ/gi, (m) => (m[0] === m[0].toUpperCase() ? "Ỏe" : "ỏe"))
    .replace(/oẽ/gi, (m) => (m[0] === m[0].toUpperCase() ? "Õe" : "õe"))
    .replace(/oẹ/gi, (m) => (m[0] === m[0].toUpperCase() ? "Ọe" : "ọe"));
}

router.post("/", async (req, res) => {
  try {
    const { hoten, donvi, phone } = req.body;

    // 1️⃣ Kiểm tra & Chuẩn hóa đầu vào
    const rawHoten = cleanInput(hoten);
    const normalizedDonvi = cleanInput(donvi);
    const normalizedPhone = cleanInput(phone);

    if (!rawHoten || !normalizedDonvi || !normalizedPhone) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin!" });
    }

    // Chuẩn hóa vị trí dấu tiếng Việt (đảm bảo đồng nhất giữa mobile & PC)
    const normalizedHoten = standardizeVietnameseAccent(rawHoten);

    // 2️⃣ Kiểm tra họ tên tồn tại bằng Collation tiếng Việt (không phân biệt hoa/thường)
    const count = await User.countDocuments({
      hoten: normalizedHoten,
    }).collation({ locale: "vi", strength: 2 });

    console.log("🧩 Check user:", normalizedHoten, "=>", count, "lần");

    // Đã chỉnh sửa ngưỡng so sánh đúng với thông báo (>= 2 lần)
    if (count >= 2) {
      return res
        .status(400)
        .json({ error: "Họ tên này đã xuất hiện quá 2 lần!" });
    }

    // 3️⃣ Tạo user mới
    const newUser = await User.create({
      hoten: normalizedHoten,
      donvi: normalizedDonvi,
      phone: normalizedPhone,
    });

    // 4️⃣ Trả về dữ liệu
    return res.status(201).json(newUser);
  } catch (err) {
    console.error("🔥 Lỗi xử lý đăng ký:", err);
    return res.status(500).json({ error: "Có lỗi xảy ra, vui lòng thử lại!" });
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
