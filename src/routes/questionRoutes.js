const express = require("express");
const Question = require("../models/Questions");
const router = express.Router();

// function shuffleArray(array) {
//   for (let i = array.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [array[i], array[j]] = [array[j], array[i]];
//   }
//   return array;
// }
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

// Hàm xáo trộn mảng
// const shuffleArray = (array) => {
//   const arr = [...array];
//   for (let i = arr.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [arr[i], arr[j]] = [arr[j], arr[i]];
//   }
//   return arr;
// };

// Hàm random trong khoảng index
const getRandomInRange = (arr, start, end, count) => {
  const filtered = arr.slice(start, end + 1);
  return shuffleArray(filtered).slice(0, count);
};

// 🧠 Hàm trộn câu trả lời (xử lý nhiều đáp án đúng & câu đặc biệt)
// 🔁 Hàm xáo trộn mảng
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// 🧠 Hàm trộn đáp án — bỏ qua shuffle nếu là câu đặc biệt
const shuffleAnswers = (question) => {
  const originalAnswers = question.traloi;
  const correct = question.dapan; // có thể là 1 số hoặc mảng số

  // Nếu không có traloi hoặc chỉ có 1 đáp án thì không cần shuffle
  if (!originalAnswers || originalAnswers.length <= 1) return question;

  // Gộp toàn bộ nội dung để phát hiện câu đặc biệt
  const text = (
    question.cauhoi +
    " " +
    originalAnswers.join(" ")
  ).toLowerCase();

  // Các cụm đặc biệt (giữ nguyên thứ tự)
  const specialPatterns = [
    "câu a, b đều đúng",
    "câu a và b đều đúng",
    "câu a, c đúng",
    "câu a, c đều đúng",
    "câu a và c đều đúng",
    "câu b, c đều đúng",
    "câu a, b, c đều đúng",
    "cả a và b đều đúng",
    "cả a, b, c đều đúng",
    "tất cả đúng",
    "tất cả đều đúng",
    "tất cả các đáp án đều đúng",
  ];

  // Nếu phát hiện là câu đặc biệt => GIỮ NGUYÊN, không shuffle
  if (specialPatterns.some((p) => text.includes(p))) {
    // console.log("⚠️ Không shuffle:", question.cauhoi, question.dapan);
    return question;
  }

  // 🔀 Shuffle các câu bình thường
  const answerPairs = originalAnswers.map((ans, i) => ({
    text: ans,
    isCorrect: Array.isArray(correct) ? correct.includes(i) : i === correct,
  }));

  const shuffled = shuffleArray(answerPairs);

  const newCorrectIndexes = shuffled
    .map((a, i) => (a.isCorrect ? i : -1))
    .filter((i) => i !== -1);

  return {
    ...(question.toObject?.() ?? question),
    traloi: shuffled.map((a) => a.text),
    dapan: Array.isArray(correct) ? newCorrectIndexes : newCorrectIndexes[0],
  };
};

router.get("/", checkAuth, async (req, res) => {
  try {
    const questions = await Question.find();
    if (!questions.length) return res.json([]);

    let selected = [];

    selected = selected.concat(getRandomInRange(questions, 0, 1, 2)); // Phần tình huống
    selected = selected.concat(getRandomInRange(questions, 2, 29, 28)); // Phần trắc nghiệm

    // 🔥 Trộn đáp án trong mỗi câu hỏi
    const randomizedQuestions = selected.map((q) => shuffleAnswers(q));

    res.json(randomizedQuestions);
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).json({ error: err.message });
  }
});

// Hàm xáo trộn mảng
// function shuffleArray(array) {
//   let currentIndex = array.length,
//     randomIndex;
//   while (currentIndex !== 0) {
//     randomIndex = Math.floor(Math.random() * currentIndex);
//     currentIndex--;
//     [array[currentIndex], array[randomIndex]] = [
//       array[randomIndex],
//       array[currentIndex],
//     ];
//   }
//   return array;
// }

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
      { new: true }, // trả về object sau khi update
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
