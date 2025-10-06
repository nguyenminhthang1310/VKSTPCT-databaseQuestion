const express = require("express");
const Question = require("../models/Questions");
const router = express.Router();

// Middleware kiểm tra header
function checkAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || authHeader !== `Bearer ${process.env.API_SECRET}`) {
    return res.status(403).json({ error: "Forbidden: Invalid token" });
  }
  next();
}
//get all
router.get("/all", checkAuth, async (req, res) => {
  const questions = await Question.find();
  res.json(questions);
});

//Get one
// Hàm xáo trộn mảng
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Hàm random trong khoảng index
const getRandomInRange = (arr, start, end, count) => {
  const filtered = arr.slice(start, end + 1);
  return shuffleArray(filtered).slice(0, count);
};

// 🧠 Hàm trộn câu trả lời và cập nhật chỉ số đáp án đúng
const shuffleAnswers = (question) => {
  const originalAnswers = question.traloi;
  const correctIndex = question.dapan;

  // Tạo mảng [đáp án, có đúng không]
  const answerPairs = originalAnswers.map((ans, index) => ({
    text: ans,
    isCorrect: index === correctIndex,
  }));

  // Xáo trộn mảng
  const shuffled = shuffleArray(answerPairs);

  // Tìm lại chỉ số của đáp án đúng sau khi shuffle
  const newCorrectIndex = shuffled.findIndex((a) => a.isCorrect);

  // Trả về question mới
  return {
    ...(question.toObject?.() ?? question),
    traloi: shuffled.map((a) => a.text),
    dapan: newCorrectIndex,
  };
};

router.get("/", checkAuth, async (req, res) => {
  try {
    const questions = await Question.find();
    if (!questions.length) return res.json([]);

    let selected = [];

    selected = selected.concat(getRandomInRange(questions, 0, 15, 3)); // Phần 1
    selected = selected.concat(getRandomInRange(questions, 16, 29, 3)); // Phần 2
    selected = selected.concat(getRandomInRange(questions, 30, 42, 3)); // Phần 3
    selected = selected.concat(getRandomInRange(questions, 43, 62, 3)); // Phần 4
    selected = selected.concat(getRandomInRange(questions, 63, 84, 2)); // Phần 5
    selected = selected.concat(getRandomInRange(questions, 85, 90, 3)); // Phần 6
    selected = selected.concat(getRandomInRange(questions, 91, 101, 3)); // Phần 7

    // 🔥 Trộn đáp án trong mỗi câu hỏi
    const randomizedQuestions = selected.map((q) => shuffleAnswers(q));

    res.json(randomizedQuestions);
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", checkAuth, async (req, res) => {
  try {
    let data = req.body;

    // Nếu là 1 object thì đưa vào mảng
    if (!Array.isArray(data)) {
      data = [data];
    }

    const newQuestions = await Question.insertMany(data);
    res.json(newQuestions);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", checkAuth, async (req, res) => {
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
router.delete("/", checkAuth, async (req, res) => {
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
router.put("/:id", checkAuth, async (req, res) => {
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
