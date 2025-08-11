const db = require("../config/db.js");

exports.createReview = (req, res) => {
  const { id_sp, so_sao, noi_dung, id_kh } = req.body;

  if (!id_sp || !so_sao || !noi_dung || !id_kh) {
    return res.status(400).json({ message: "Thiếu thông tin đánh giá" });
  }

  const ngay_danh_gia = new Date().toISOString().split("T")[0];
  const an_hien = 1;

  const sql = `INSERT INTO danhgia (id_sp, id_kh, so_sao, noi_dung, ngay_danh_gia, an_hien)
               VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(sql, [id_sp, id_kh, so_sao, noi_dung, ngay_danh_gia, an_hien], (err, result) => {
    if (err) return res.status(500).json({ message: "Lỗi khi thêm đánh giá", error: err });
    res.status(200).json({ message: "Gửi đánh giá thành công" });
  });
};

exports.getReviewsByProductId = (req, res) => {
  const { id_sp } = req.params;

  const sql = `
    SELECT dg.*, nd.ho_ten
    FROM danhgia dg
    JOIN nguoidung nd ON dg.id_kh = nd.id_kh
    WHERE dg.id_sp = ? AND dg.an_hien = 1
    ORDER BY dg.ngay_danh_gia DESC
  `;

  db.query(sql, [id_sp], (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi truy vấn đánh giá", details: err });
    res.json(Array.isArray(results) ? results : []);
  });
};



exports.getReviewSummaryByProductId = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT
      COUNT(*) AS total_reviews,
      ROUND(AVG(so_sao), 1) AS average_rating,
      SUM(CASE WHEN so_sao = 5 THEN 1 ELSE 0 END) AS star_5,
      SUM(CASE WHEN so_sao = 4 THEN 1 ELSE 0 END) AS star_4,
      SUM(CASE WHEN so_sao = 3 THEN 1 ELSE 0 END) AS star_3,
      SUM(CASE WHEN so_sao = 2 THEN 1 ELSE 0 END) AS star_2,
      SUM(CASE WHEN so_sao = 1 THEN 1 ELSE 0 END) AS star_1
    FROM danhgia
    WHERE id_sp = ? AND an_hien = 1
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Lỗi truy vấn đánh giá tổng kết:", err);
      return res.status(500).json({ error: "Lỗi truy vấn đánh giá tổng kết" });
    }
    res.json(results[0] || {
      total_reviews: 0,
      average_rating: 0,
      star_5: 0,
      star_4: 0,
      star_3: 0,
      star_2: 0,
      star_1: 0
    });
  });
};
