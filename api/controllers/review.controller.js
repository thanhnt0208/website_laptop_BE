const db = require("../config/db");



exports.createReview = (req, res) => {
  try {
    const { id_kh, id_sp, so_sao, noi_dung } = req.body;
    if (!id_kh || !id_sp || !so_sao) {
      return res.status(400).json({ error: "Thiếu thông tin" });
    }

    const hinh  = req.files?.images?.length ? req.files.images[0].filename : null;
    const video = req.files?.videos?.length ? req.files.videos[0].filename : null;

    // 1. Tìm id_ct đúng (sản phẩm này trong đơn hàng đã giao)
    const sqlGet = `
      SELECT ct.id_ct
      FROM chitiet_donhang ct
      JOIN donhang dh ON ct.id_dh = dh.id_dh
      WHERE dh.id_kh = ? AND ct.id_sp = ? AND dh.trang_thai IN (4,5)
      ORDER BY dh.ngay_dat DESC, ct.id_ct DESC
      LIMIT 1
    `;

    db.query(sqlGet, [id_kh, id_sp], (err, rows) => {
      if (err) return res.status(500).json({ error: "Lỗi server khi lấy chi tiết đơn hàng" });
      if (rows.length === 0) {
        return res.status(400).json({ error: "Bạn chưa mua hoặc đơn chưa giao xong sản phẩm này" });
      }

      const id_ct = rows[0].id_ct;

      // 2. Kiểm tra đã đánh giá chưa
      const sqlCheck = `SELECT 1 FROM danhgia WHERE id_ct = ? LIMIT 1`;
      db.query(sqlCheck, [id_ct], (errCheck, rowsCheck) => {
        if (errCheck) return res.status(500).json({ error: "Lỗi server khi kiểm tra đánh giá" });
        if (rowsCheck.length > 0) {
          return res.status(400).json({ error: "Sản phẩm này đã được đánh giá" });
        }

        // 3. Insert đánh giá
        const sqlInsert = `
          INSERT INTO danhgia (id_kh, id_ct, so_sao, noi_dung, hinh, video, ngay_danh_gia, an_hien)
          VALUES (?, ?, ?, ?, ?, ?, NOW(), 1)
        `;
        const values = [id_kh, id_ct, so_sao, noi_dung, hinh, video];

        db.query(sqlInsert, values, (err2, result) => {
          if (err2) return res.status(500).json({ error: "Lỗi server khi thêm đánh giá" });

          res.status(201).json({
            message: "Đánh giá đã được thêm thành công!",
            reviewId: result.insertId,
            id_ct
          });
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi server" });
  }
};




exports.getReviewsByProduct = (req, res) => {
  const { id_sp } = req.params;

  // Lấy danh sách đánh giá (mới nhất trước)
  const sqlReviews = `
    SELECT dg.id_dg, dg.so_sao, dg.noi_dung, dg.hinh, dg.video, dg.ngay_danh_gia,
           nd.ho_ten, ct.id_sp
    FROM danhgia dg
    JOIN chitiet_donhang ct ON dg.id_ct = ct.id_ct
    JOIN nguoidung nd ON dg.id_kh = nd.id_kh
    WHERE ct.id_sp = ? AND dg.an_hien = 1
    ORDER BY dg.ngay_danh_gia DESC
  `;

  // Lấy tổng quan rating
  const sqlSummary = `
    SELECT 
      COUNT(*) AS total_reviews,
      ROUND(AVG(so_sao), 1) AS average_rating,
      SUM(CASE WHEN so_sao = 5 THEN 1 ELSE 0 END) AS star_5,
      SUM(CASE WHEN so_sao = 4 THEN 1 ELSE 0 END) AS star_4,
      SUM(CASE WHEN so_sao = 3 THEN 1 ELSE 0 END) AS star_3,
      SUM(CASE WHEN so_sao = 2 THEN 1 ELSE 0 END) AS star_2,
      SUM(CASE WHEN so_sao = 1 THEN 1 ELSE 0 END) AS star_1
    FROM danhgia dg
    JOIN chitiet_donhang ct ON dg.id_ct = ct.id_ct
    WHERE ct.id_sp = ? AND dg.an_hien = 1
  `;

  db.query(sqlReviews, [id_sp], (err, reviews) => {
    if (err) {
      console.error("SQL ERROR (reviews):", err);
      return res.status(500).json({ error: "Lỗi server khi lấy đánh giá" });
    }

    // Chuẩn hoá dữ liệu trả về
    const formattedReviews = reviews.map(r => ({
      ...r,
      images: r.hinh ? [r.hinh] : [],
      videos: r.video ? [r.video] : []
    }));

    db.query(sqlSummary, [id_sp], (err2, summaryRows) => {
      if (err2) {
        console.error("SQL ERROR (summary):", err2);
        return res.status(500).json({ error: "Lỗi server khi lấy thống kê" });
      }

      const summary = summaryRows[0] || {
        total_reviews: 0,
        average_rating: 0,
        star_5: 0,
        star_4: 0,
        star_3: 0,
        star_2: 0,
        star_1: 0
      };

      res.json({ reviews: formattedReviews, summary });
    });
  });
};




exports.getOrderDetails = (req, res) => {
  const { id_dh } = req.params;

  const sql = `
    SELECT ct.*, sp.ten_sp,
           EXISTS(SELECT 1 FROM danhgia dg WHERE dg.id_ct = ct.id_ct) AS reviewed
    FROM chitiet_donhang ct
    JOIN sanpham sp ON ct.id_sp = sp.id_sp
    WHERE ct.id_dh = ?
  `;

  db.query(sql, [id_dh], (err, rows) => {
    if (err) return res.status(500).json({ error: "Lỗi server khi lấy chi tiết đơn hàng" });
    res.json(rows);
  });
};





