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
  const questions = await Question.find();
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
router.put("/:id", async (req, res) => {
  try {
    const { cauhoi, traloi, dapan } = req.body;

    const updated = await Question.findByIdAndUpdate(
      req.params.id,
      { cauhoi, traloi, dapan },
      { new: true } // trả về object sau khi update
    );

    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy câu hỏi" });
    }

    res.json({ message: "Cập nhật thành công", question: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server", error: err });
  }
});

module.exports = router;
