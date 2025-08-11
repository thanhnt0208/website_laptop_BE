const db = require("../config/db.js");

// ✅ Lấy tất cả đánh giá (cho admin)
exports.getAllReviews = (req, res) => {
  const sql = `
    SELECT dg.*, kh.ho_ten, sp.ten AS ten_sp
    FROM danhgia dg
    JOIN nguoidung kh ON dg.id_kh = kh.id_kh
    JOIN sanpham sp ON dg.id_sp = sp.id_sp
    ORDER BY dg.ngay_danh_gia DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

// ✅ Lấy đánh giá đã duyệt (an_hien = 1) cho frontend
exports.getVisibleReviews = (req, res) => {
  const sql = `
    SELECT dg.*, kh.ho_ten, sp.ten AS ten_sp
    FROM danhgia dg
    JOIN nguoidung kh ON dg.id_kh = kh.id_kh
    JOIN sanpham sp ON dg.id_sp = sp.id_sp
    WHERE dg.an_hien = 1
    ORDER BY dg.ngay_danh_gia DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

// ✅ Lấy đánh giá theo ID
exports.getReviewById = (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT dg.*, kh.ho_ten, sp.ten AS ten_sp
    FROM danhgia dg
    JOIN nguoidung kh ON dg.id_kh = kh.id_kh
    JOIN sanpham sp ON dg.id_sp = sp.id_sp
    WHERE dg.id_dg = ?
  `;
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    res.json(results[0]);
  });
};


// ✅ Ẩn/hiện đánh giá (toggle an_hien)
exports.toggleVisibility = (req, res) => {
  const id = req.params.id;
  const sql = "UPDATE danhgia SET an_hien = NOT an_hien WHERE id_dg = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Đã thay đổi trạng thái hiển thị" });
  });
};
