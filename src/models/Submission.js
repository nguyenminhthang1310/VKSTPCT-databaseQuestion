const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    user_id: String,
    answers: [
      {
        cauhoi: String,
        dapanchon: String,
        dapan_dung: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
