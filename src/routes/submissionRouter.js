const express = require("express");
const Submission = require("../models/Submission");

const router = express.Router();

// ✅ POST: tạo submission
router.post("/", async (req, res) => {
  try {
    console.log("📥 Nhận submission:", req.body);

    const submission = new Submission(req.body);
    const saved = await submission.save();

    // console.log("✅ Lưu submission thành công:", saved);
    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Lỗi khi lưu submission:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET: lấy tất cả submissions
router.get("/", async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    // console.error("❌ Lỗi lấy submissions:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET: lấy submissions theo user_id
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const submissions = await Submission.find({ user_id: userId }).sort({
      createdAt: -1,
    });

    if (!submissions.length) {
      return res.status(404).json({ message: "Không tìm thấy submission" });
    }

    res.json(submissions);
  } catch (err) {
    console.error("❌ Lỗi lấy submissions theo user:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE: xóa submissions theo userId
router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await Submission.deleteMany({ user_id: userId });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy submission để xóa" });
    }

    res.json({
      message: `Đã xóa ${result.deletedCount} submissions của user ${userId}`,
    });
  } catch (err) {
    console.error("❌ Lỗi khi xóa submissions:", err.message);
    res.status(500).json({ error: err.message });
  }
});
// ✅ DELETE: xóa tất cả submissions
router.delete("/", async (req, res) => {
  try {
    const result = await Submission.deleteMany({});

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "Không có submission nào để xóa" });
    }

    res.json({
      message: `Đã xóa thành công toàn bộ ${result.deletedCount} submissions trên hệ thống`,
    });
  } catch (err) {
    console.error("❌ Lỗi khi xóa tất cả submissions:", err.message);
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
