const db = require('../config/db.js');

// GET all
exports.getAllnguoidung = (req, res) => {
  db.query('SELECT * FROM nguoidung', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

// GET by ID
exports.getnguoidungById = (req, res) => {
  const { id_kh } = req.params;
  db.query('SELECT * FROM nguoidung WHERE id_kh = ?', [id_kh], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(results[0]);
  });
};

// PUT
exports.updatenguoidung = (req, res) => {
  const { id_kh } = req.params;
  const { ho_ten, email, mat_khau, dia_chi, sdt } = req.body;
  if (typeof mat_khau === 'undefined' || mat_khau === '') {
    db.query(
      'UPDATE nguoidung SET ho_ten = ?, email = ?, dia_chi = ?, sdt = ? WHERE id_kh = ?',
      [ho_ten, email, dia_chi, sdt, id_kh],
      (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Đã cập nhật thông tin khách hàng' });
      }
    );
  } else {
    // Nếu có gửi mat_khau (có thể dùng cho admin)
    db.query(
      'UPDATE nguoidung SET ho_ten = ?, email = ?, mat_khau = ?, dia_chi = ?, sdt = ? WHERE id_kh = ?',
      [ho_ten, email, mat_khau, dia_chi, sdt, id_kh],
      (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Đã cập nhật thông tin + mật khẩu' });
      }
    );
  }
};

const bcrypt = require('bcrypt');

// API đổi mật khẩu
exports.doimatkhau = (req, res) => {
  const { id_kh } = req.params;
  const { currentPassword, newPassword } = req.body;

  // Bước 1: Lấy mật khẩu hiện tại từ DB
  db.query('SELECT mat_khau FROM nguoidung WHERE id_kh = ?', [id_kh], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu' });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    const hashedPassword = results[0].mat_khau;

    // Bước 2: So sánh mật khẩu hiện tại
    const match = await bcrypt.compare(currentPassword, hashedPassword);
    if (!match) return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });

    // Bước 3: Mã hóa mật khẩu mới
    const saltRounds = 10;
    const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Bước 4: Cập nhật mật khẩu mới vào DB
    db.query('UPDATE nguoidung SET mat_khau = ? WHERE id_kh = ?', [newHashedPassword, id_kh], (err) => {
      if (err) return res.status(500).json({ error: 'Cập nhật mật khẩu thất bại' });

      res.json({ message: 'Đổi mật khẩu thành công' });
    });
  });
};
