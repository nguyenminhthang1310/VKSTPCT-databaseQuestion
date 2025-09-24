const express = require("express");
const router = express.Router();
const Submission = require("../models/Submission");

function checkAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || authHeader !== `Bearer ${process.env.API_SECRET}`) {
    return res.status(403).json({ error: "Forbidden: Invalid token" });
  }
  next();
}

// Thêm user mission (bài làm)
router.post("/", checkAuth, async (req, res) => {
  try {
    const { user_id, answers } = req.body;
    if (!user_id || !answers || !answers.length) {
      return res.status(400).json({ error: "Thiếu user_id hoặc answers" });
    }

    const newUsermission = await Submission.create({ user_id, answers });
    res.status(201).json(newUsermission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET submissions của user
router.get("/:id", checkAuth, async (req, res) => {
  try {
    const userId = req.params.id;

    const submissions = await Submission.find({ user_id: userId }).sort({
      createdAt: -1,
    });

    res.status(200).json(submissions);
  } catch (err) {
    console.error("❌ Lỗi lấy submissions:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
