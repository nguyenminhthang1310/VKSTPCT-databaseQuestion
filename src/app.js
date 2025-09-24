const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const questionRoutes = require("./routes/questionRoutes");
const submissionRouters = require("./routes/submissionRouter");
require("dotenv").config();
const cors = require("cors");

const app = express();

// Middleware parse JSON
app.use(express.json());

// ✅ Cấu hình CORS
app.use(
  cors({
    origin: ["http://localhost:5173", "https://vkstpct-software.vercel.app"], // cho phép frontend Vite gọi API
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Routes
app.use("/users", userRoutes);
app.use("/questions", questionRoutes);
app.use("/submission", submissionRouters);


// Kết nối DB và chạy server
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(
      `🚀 Server running at http://localhost:${PORT}, ${process.env.API_SECRET}`
    )
  );
});
