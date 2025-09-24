import axios from "axios";
const API_URL = "https://vkstpct-databasequestion.onrender.com/submission";
const token = import.meta.env.VITE_API_TOKEN;

// Hàm GET tất cả submission
export async function fetchSubmission() {
  try {
    const res = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    console.log("📤 GET submissions:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Lỗi GET submissions:", err);
    throw err;
  }
}

// Hàm POST tạo submission mới
export async function createSubmission(data) {
  try {
    const res = await axios.post(API_URL, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    console.log("📤 POST submission:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Lỗi POST submission:", err);
    throw err;
  }
}
