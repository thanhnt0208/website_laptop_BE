const db = require("../config/db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.loginAdmin = (req, res) => {
  const { email, mat_khau } = req.body;

  db.query("SELECT * FROM nhanvien WHERE email = ?", [email], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0) {
      return res.status(401).json({ error: "Tài khoản không tồn tại" });
    }

    const admin = result[0];


    if (admin.an_hien === 0) { 
      return res.status(403).json({ error: "Tài khoản của bạn đã bị vô hiệu hóa, vui lòng liên hệ quản trị viên." });
    }


    if (!bcrypt.compareSync(mat_khau, admin.mat_khau)) {
      return res.status(401).json({ error: "Sai mật khẩu" });
    }


    let roleName;
    switch (admin.vai_tro) {
      case 0:
        roleName = "super admin";
        break;
      case 1:
        roleName = "admin";
        break;
      case 2:
        roleName = "nhân viên đóng gói";
        break;
      default:
        roleName = "unknown";
    }

    // Tạo token
    const token = jwt.sign(
      { id: admin.id_nv, role: admin.vai_tro },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: `Đăng nhập ${roleName} thành công`,
      token,
      admin: {
        id_nv: admin.id_nv,
        ho_ten: admin.ho_ten,
        email: admin.email,
        vai_tro: admin.vai_tro,
        role_name: roleName,
      }
    });
  });
};

