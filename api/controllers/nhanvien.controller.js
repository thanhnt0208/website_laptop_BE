const db = require("../config/db");
const bcrypt = require("bcrypt");

// Lấy tất cả nhân viên kèm cột an_hien
exports.getAllNhanVien = (req, res) => {
  db.query("SELECT id_nv, ho_ten, email, sdt, vai_tro, an_hien FROM nhanvien", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

// Thêm nhân viên
exports.createNhanVien = (req, res) => {
  const { ho_ten, email, mat_khau, vai_tro } = req.body;
  bcrypt.hash(mat_khau, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(
      "INSERT INTO nhanvien (ho_ten, email, mat_khau, vai_tro, an_hien) VALUES (?, ?, ?, ?, 1)",
      [ho_ten, email, hashedPassword, vai_tro],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Thêm nhân viên thành công" });
      }
    );
  });
};

// Sửa nhân viên
exports.updateNhanVien = (req, res) => {
  const { ho_ten, email, mat_khau, vai_tro } = req.body;
  bcrypt.hash(mat_khau, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query(
        "UPDATE nhanvien SET ho_ten=?, email=?, mat_khau=?, vai_tro=? WHERE id_nv=?",
        [ho_ten, email, hashedPassword, vai_tro, req.params.id],
        (err, result) => { 
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Cập nhật nhân viên thành công" });
        }
    );
  });
};

// Ẩn/hiện nhân viên
exports.toggleNhanVien = (req, res) => {
  const { an_hien } = req.body; 
  db.query(
    "UPDATE nhanvien SET an_hien=? WHERE id_nv=?",
    [an_hien, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: an_hien === 1 ? "Hiện nhân viên thành công" : "Ẩn nhân viên thành công" });
    }
  );
};
