const mongoose = require("mongoose");
const moment = require("moment-timezone"); // ✅ import moment-timezone

const questionSchema = new mongoose.Schema(
  {
    cauhoi: { type: String, required: true },
    traloi: { type: Array, required: true },
    dapan: { type: Number, required: true },
  },
  { timestamps: true }
);

// ✅ Tự động format createdAt & updatedAt sang giờ Việt Nam khi trả về JSON
questionSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.createdAt = moment(obj.createdAt)
    .tz("Asia/Ho_Chi_Minh")
    .format("YYYY-MM-DD HH:mm:ss");
  obj.updatedAt = moment(obj.updatedAt)
    .tz("Asia/Ho_Chi_Minh")
    .format("YYYY-MM-DD HH:mm:ss");
  return obj;
};

module.exports = mongoose.model("Question", questionSchema);
