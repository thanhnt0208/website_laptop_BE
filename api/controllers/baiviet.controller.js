const db = require('../config/db.js');

// Lấy tất cả bài viết (admin không lọc `an_hien`)
exports.adminGetAllPosts = (req, res) => {
  const sql = "SELECT * FROM baiviet ORDER BY id_bv DESC"; 
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi truy vấn CSDL" });
    res.json(results);
  });
};


// Xóa bài viết
exports.toggleVisibility = (req, res) => {
  const { id } = req.params;
  const { an_hien } = req.body;

  const sql = "UPDATE baiviet SET an_hien = ? WHERE id_bv = ?";
  db.query(sql, [an_hien, id], (err, result) => {
    if (err) return res.status(500).json({ error: "Lỗi cập nhật trạng thái" });
    res.json({ message: "✅ Cập nhật trạng thái thành công" });
  });
};


// Thêm bài viết mới
exports.createPost = (req, res) => {
const { tieu_de, noi_dung, hinh, ngay, an_hien, id_nv } = req.body;
const sql = `INSERT INTO baiviet (tieu_de, noi_dung, hinh, ngay, an_hien, id_nv) VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(sql, [tieu_de, noi_dung, hinh, ngay, an_hien,  id_nv], (err, result) => {
  if (err) {
    console.error("Lỗi khi thêm bài viết:", err);
    return res.status(500).json({ error: "Lỗi khi thêm bài viết" });
  }
  res.status(201).json({ message: "✅ Thêm bài viết thành công" });
});

};


// Sửa
exports.updatePost = (req, res) => {
  const { id } = req.params;
  const { tieu_de, noi_dung, hinh, ngay, an_hien } = req.body;

  const sql = "UPDATE baiviet SET tieu_de = ?, noi_dung = ?, hinh=?, ngay = ?, an_hien = ? WHERE id_bv = ?";
  db.query(sql, [tieu_de, noi_dung, hinh, ngay, an_hien, id], (err, result) => {
    if (err) return res.status(500).json({ error: "Lỗi khi cập nhật bài viết" });
    res.json({ message: "✅ Cập nhật bài viết thành công" });
  });
};