const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    user_id: String,
    answers: [
      {
        cauhoi: String,
        dapanchon: String,
        dapan_dung: String, // 👈 Bắt buộc là String
      },
    ],
  },
  { timestamps: true }
);

// 👇 Thêm dòng này để đảm bảo dùng schema mới, tránh cache schema cũ
module.exports =
  mongoose.models.Submission || mongoose.model("Submission", submissionSchema);
