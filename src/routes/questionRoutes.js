const express = require("express");
const Question = require("../models/Questions");
const router = express.Router();

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
// Lấy danh sách cau hoi
router.get("/", async (req, res) => {
  const questions = await Question.find().limit(10);
  res.json(shuffleArray(questions));
});

// Thêm cau hoi
router.post("/", async (req, res) => {
  try {
    const { cauhoi, traloi, dapan } = req.body;
    const newQuestion = await Question.create({ cauhoi, traloi, dapan });
    res.json(newQuestion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Question.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Question not found" });
    }
    res.json({ message: "🗑️ Question deleted successfully", deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.delete("/", async (req, res) => {
  try {
    const result = await Question.deleteMany({});
    res.json({
      message: "⚠️ All questions deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
