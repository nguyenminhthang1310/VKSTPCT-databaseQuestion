const express = require("express");
const User = require("../models/Users");
const router = express.Router();

// Lấy danh sách user
router.get("/", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Thêm user
router.post("/", async (req, res) => {
  try {
    const { hoten, donvi } = req.body;
    const newUser = await User.create({ hoten, donvi });
    res.json(newUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Sửa user
router.put("/:id", async (req, res) => {
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
// Xếp hạng theo điểm và thời gian
router.get("/rank", async (req, res) => {
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

//xóa all
router.delete("/all", async (req, res) => {
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
module.exports = router;
