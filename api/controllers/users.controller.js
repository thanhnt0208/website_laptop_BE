const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Đăng nhập
exports.loginUser = (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM nguoidung WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(401).json({ message: "Email không tồn tại" });

    const user = results[0];

    // Kiểm tra trạng thái tài khoản: 0 là ẩn, không cho đăng nhập
    if (user.trang_thai === 0) {
      return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa hoặc ẩn, không thể đăng nhập." });
    }

    bcrypt.compare(password, user.mat_khau, (err, isMatch) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!isMatch) return res.status(401).json({ message: "Mật khẩu không đúng" });

      const token = jwt.sign(
        { id: user.id_kh, email: user.email },
        process.env.JWT_SECRET || "SECRET_KEY",
        { expiresIn: "1d" }
      );

      res.json({ message: "Đăng nhập thành công", token, user }); // Trả luôn user về frontend
    });
  });
};
// Lấy đơn hàng của người dùng theo ID (trong 3 tháng gần nhất)
exports.getOrdersByUser = (req, res) => {
  const userId = req.params.id;

  const query = `
    SELECT * FROM donhang
    WHERE id_kh = ?
      AND ngay_dat >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy đơn hàng của người dùng:", err);
      return res.status(500).json({ message: "Lỗi server" });
    }

    res.json(results);
  });
};

// Lấy tất cả người dùng
exports.getAllUsers = (req, res) => {
  db.query("SELECT * FROM nguoidung", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Lấy người dùng theo ID
exports.getUserById = (req, res) => {
  const id = req.params.id;
  db.query("SELECT * FROM nguoidung WHERE id_kh = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: "Không tìm thấy người dùng" });
    res.json(results[0]);
  });
};

// Cập nhật trạng thái người dùng (ẩn/hiện)
exports.updateUserStatus = (req, res) => {
  const id = req.params.id;
  const { trangthai } = req.body;
  db.query(
    "UPDATE nguoidung SET trangthai = ? WHERE id_kh = ?",
    [trangthai, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Không tìm thấy người dùng để cập nhật" });
      res.json({ message: "Cập nhật trạng thái thành công" });
    }
  );
};
