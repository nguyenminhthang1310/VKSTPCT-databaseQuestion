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
router.get("/", checkAuth, async (req, res) => {
  try {
    const questions = await Question.find();

    if (!questions.length) {
      return res.json([]); // không có câu hỏi nào
    }

    const soCauMoiPhan = 20;
    const soLuongMoiPhan = 6;
    const tongSoPhan = Math.ceil(questions.length / soCauMoiPhan);

    // Tạo mảng grouped với số phần đúng bằng dữ liệu thực tế
    const grouped = Array.from({ length: tongSoPhan }, () => []);

    questions.forEach((q, idx) => {
      const phan = Math.floor(idx / soCauMoiPhan);
      grouped[phan].push(q);
    });

    let selected = [];

    grouped.forEach((arr) => {
      if (arr.length) {
        const shuffled = shuffleArray(arr);
        selected = selected.concat(shuffled.slice(0, soLuongMoiPhan));
      }
    });

    res.json(shuffleArray(selected));
  } catch (err) {
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
