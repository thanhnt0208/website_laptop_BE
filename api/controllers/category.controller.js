const db = require("../config/db.js");

// Lấy tất cả categories
exports.getCategories = (req, res) => {
  db.query("SELECT * FROM danhmuc", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

// thêm danh mục
exports.createCategory = (req, res) => {
  const { ten_dm, thu_tu, an_hien } = req.body;

  if (!ten_dm || !thu_tu) {
    return res.status(400).json({ message: "Thiếu thông tin" });
  }

  const sql = `INSERT INTO danhmuc (ten_dm, thu_tu, an_hien) VALUES (?, ?, ?)`;
  db.query(sql, [ten_dm, thu_tu, an_hien], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const insertedId = result.insertId;


    db.query("SELECT * FROM danhmuc WHERE id_dm = ?", [insertedId], (err2, rows) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.status(201).json(rows[0]);
    });
  });
};


// sửa danh mục
exports.updateCategory = (req, res) => {
  const { id_dm } = req.params;
  const { ten_dm, thu_tu, an_hien } = req.body;

  const sql = `UPDATE danhmuc SET ten_dm = ?, thu_tu = ?, an_hien = ? WHERE id_dm = ?`;

  db.query(sql, [ten_dm, thu_tu, an_hien, id_dm], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy danh mục để cập nhật!" });
    }


    db.query("SELECT * FROM danhmuc WHERE id_dm = ?", [id_dm], (err2, rows) => {
      if (err2) return res.status(500).json({ error: err2.message });

      res.json(rows[0]); 
    });
  });
};


// Ẩn danh mục thay vì xoá
exports.deleteCategory = (req, res) => {
  const { id_dm } = req.params;

  const sql = "UPDATE danhmuc SET an_hien = 0 WHERE id_dm = ?";

  db.query(sql, [id_dm], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy danh mục để ẩn." });
    }

    res.json({ message: "Ẩn danh mục thành công!" });
  });
};

exports.toggleCategory = (req, res) => {
  const { id_dm } = req.params;

  // Lấy trạng thái hiện tại
  db.query("SELECT an_hien FROM danhmuc WHERE id_dm = ?", [id_dm], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy danh mục" });

    const currentStatus = rows[0].an_hien;
    const newStatus = currentStatus === 1 ? 0 : 1;

    // Cập nhật trạng thái mới
    db.query("UPDATE danhmuc SET an_hien = ? WHERE id_dm = ?", [newStatus, id_dm], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ message: "Cập nhật trạng thái thành công", an_hien: newStatus });
    });
  });
};