const db = require("../config/db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const otpStore = new Map(); // Lưu OTP tạm trong RAM

// Cấu hình gửi mail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// === ĐĂNG KÝ VỚI OTP ===
exports.registerUser = (req, res) => {
  const { ho_ten, email, mat_khau, sdt } = req.body;
  const hash = bcrypt.hashSync(mat_khau, 10);

  db.query("SELECT * FROM nguoidung WHERE email = ?", [email], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length > 0) return res.status(400).json({ error: "Email đã tồn tại" });

    // Tạo mã OTP và lưu tạm
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(email, { otp, expiresAt, ho_ten, hash, sdt });

    // Gửi mail
    const mailOptions = {
      from: `"Laptop Store" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Mã OTP xác minh tài khoản",
      html: `<p>Chào ${ho_ten}, mã xác minh của bạn là: <strong>${otp}</strong></p>
             <p>Mã sẽ hết hạn sau 10 phút.</p>`,
    };

    transporter.sendMail(mailOptions, (err2) => {
      if (err2) return res.status(500).json({ error: "Gửi email thất bại" });
      res.json({ message: "Mã OTP đã được gửi qua email." });
    });
  });
};

// === XÁC MINH OTP ===
exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;
  const entry = otpStore.get(email);
  if (!entry) return res.status(400).json({ error: "Không tìm thấy yêu cầu đăng ký hoặc mã OTP đã hết hạn." });

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: "Mã OTP đã hết hạn." });
  }

  if (String(entry.otp) !== String(otp)) {
    return res.status(400).json({ error: "Mã OTP không chính xác." });
  }

  // Thêm người dùng vào DB
    db.query(
    "INSERT INTO nguoidung (ho_ten, email, mat_khau, sdt, da_xac_thuc, trangthai) VALUES (?, ?, ?, ?, 1, 0)",
    [entry.ho_ten, email, entry.hash, entry.sdt],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      otpStore.delete(email);
      res.json({ message: "Xác minh thành công" });
    }
  );
};

// === ĐĂNG NHẬP ===
// Đăng nhập cho cả user + admin với kiểm tra trạng thái
exports.login = (req, res) => {
  const { email, mat_khau } = req.body;

  const checkUser = () => {
    db.query("SELECT * FROM nguoidung WHERE email = ?", [email], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.length === 0) return checkAdmin(); // Không thấy user thì kiểm admin

      const user = result[0];
      if (!user.da_xac_thuc)
        return res.status(403).json({ error: "Tài khoản chưa xác minh email." });

      if (user.trang_thai === 1) {
        return res.status(403).json({ error: "Tài khoản của bạn đã bị khóa hoặc ẩn, không thể đăng nhập." });
      }

      if (!bcrypt.compareSync(mat_khau, user.mat_khau))
        return res.status(401).json({ error: "Sai mật khẩu" });

      const token = jwt.sign({ id: user.id_kh, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1d" });
      res.json({ message: "Đăng nhập thành công", token, user });
    });
  };

  const checkAdmin = () => {
    db.query("SELECT * FROM nhanvien WHERE email = ?", [email], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.length === 0) return res.status(401).json({ error: "Tài khoản không tồn tại" });

      const admin = result[0];
      if (!bcrypt.compareSync(mat_khau, admin.mat_khau))
        return res.status(401).json({ error: "Sai mật khẩu" });

      const token = jwt.sign({ id: admin.id_nv, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1d" });
      res.json({ message: "Đăng nhập admin thành công", token, user: admin });
    });
  };

  checkUser();
};

// === QUÊN MẬT KHẨU ===
exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  db.query(
    'SELECT * FROM nguoidung WHERE email = ?',
    [email],
    (err, users) => {
      if (err) return res.status(500).json({ error: err.message });
      if (users.length === 0) {
        return res.status(404).json({ error: 'Email không tồn tại' });
      }

      // Tạo mã OTP 6 số
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpire = new Date(Date.now() + 5 * 60 * 1000); // hết hạn sau 5 phút

      // Lưu OTP vào DB (giả sử có cột otp_code và otp_expire)
      db.query(
        'UPDATE nguoidung SET otp_code = ?, otp_expire = ? WHERE email = ?',
        [otpCode, otpExpire, email],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });

          // Gửi OTP qua email
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
            }
          });

          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Xác nhận OTP - Ứng dụng của bạn',
            html: `
              <p>Mã OTP của bạn là: <strong>${otpCode}</strong></p>
              <p>OTP sẽ hết hạn sau 5 phút.</p>
            `
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              return res.status(500).json({ error: 'Gửi email thất bại: ' + error.message });
            }
            return res.json({
              message: 'Mã OTP đã được gửi về email của bạn',
              expireAt: otpExpire
            });
          });
        }
      );
    }
  );
};

// === XÁC MINH OTP QUÊN MẬT KHẨU ===
exports.verifyOtpForgot = (req, res) => {
  const { email, otp } = req.body;

  db.query(
    "SELECT otp_code, otp_expire FROM nguoidung WHERE email = ?",
    [email],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.length === 0) return res.status(404).json({ error: "Email không tồn tại" });

      const { otp_code, otp_expire } = result[0];
      if (!otp_code || !otp_expire) {
        return res.status(400).json({ error: "Chưa gửi OTP hoặc OTP đã bị xóa" });
      }

      if (new Date() > new Date(otp_expire)) {
        return res.status(400).json({ error: "OTP đã hết hạn" });
      }

      if (String(otp_code) !== String(otp)) {
        return res.status(400).json({ error: "OTP không chính xác" });
      }

      // Xác minh thành công → cho phép sang bước reset mật khẩu
      return res.json({ message: "Xác minh OTP thành công" });
    }
  );
};

// === ĐẶT LẠI MẬT KHẨU ===
exports.resetPassword = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Thiếu email hoặc mật khẩu mới" });
  }

  // Kiểm tra email tồn tại
  db.query("SELECT * FROM nguoidung WHERE email = ?", [email], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0) {
      return res.status(404).json({ error: "Email không tồn tại" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    // Cập nhật mật khẩu mới và xóa OTP
    db.query(
      "UPDATE nguoidung SET mat_khau = ?, otp_code = NULL, otp_expire = NULL WHERE email = ?",
      [hashedPassword, email],
      (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        return res.json({ message: "Đổi mật khẩu thành công" });
      }
    );
  });
};
