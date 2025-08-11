const db = require('../config/db.js'); 

exports.getAllPosts = (req, res) => {
  const sql = "SELECT * FROM baiviet WHERE an_hien = 1 ORDER BY ngay DESC";

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi truy vấn CSDL" });
    res.json(results);
  });
};

exports.getPostById = (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM baiviet WHERE id_bv = ? AND an_hien = 1";

  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi truy vấn CSDL" });
    if (results.length === 0) return res.status(404).json({ error: "Không tìm thấy bài viết" });
    res.json(results[0]);
  });
};
