require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Import routes
const homeRoutes = require("./routes/home.routes");
const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");
const authRoutes = require("./routes/auth.route");
const checkoutRoutes = require("./routes/checkout.routes");
const nguoidungRoutes = require("./routes/nguoidung.routes");
const discountRoutes = require("./routes/discount.routes");
const postRoutes = require("./routes/post.routes");
const orderRoutes = require("./routes/order.route");
const discountadminRoutes = require("./routes/discountadmin.routes");
const vnpayRoutes = require("./routes/vnpay.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const baivietRoutes = require("./routes/baiviet.routes");
const userRoutes = require("./routes/user.route");
const reviewRoutes = require("./routes/review.route");
const reviewAdminRoutes = require("./routes/reviewadmin.route");

// Sử dụng routes
app.use("/api/home", homeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", checkoutRoutes);
app.use("/api/nguoidung", nguoidungRoutes);
app.use("/api/discount", discountRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/order", orderRoutes);
app.use("/admin/discount", discountadminRoutes);
app.use("/api/vnpay", vnpayRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/post", baivietRoutes);
app.use("/api/user", userRoutes); 
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin/reviews", reviewAdminRoutes);

// Khởi động server
app.listen(port, () => {
  console.log(`✅ API đang chạy tại http://localhost:${port}`);
}).on("error", (err) => {
  console.error(`❌ Lỗi khi khởi động server: ${err.message}`);
});
