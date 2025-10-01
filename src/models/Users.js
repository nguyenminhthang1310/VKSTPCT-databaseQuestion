const mongoose = require("mongoose");
const moment = require("moment-timezone");

const userSchema = new mongoose.Schema(
  {
    hoten: { type: String, required: true },
    donvi: { type: String, required: true },
    phone: { type: String, required: true },
    traloidung: { type: Number, default: 0 },
    thoigianlambai: { type: String, default: "" },
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.createdAt = moment(obj.createdAt)
    .tz("Asia/Ho_Chi_Minh")
    .format("YYYY-MM-DD HH:mm:ss");
  obj.updatedAt = moment(obj.updatedAt)
    .tz("Asia/Ho_Chi_Minh")
    .format("YYYY-MM-DD HH:mm:ss");
  return obj;
};
module.exports = mongoose.model("User", userSchema);
