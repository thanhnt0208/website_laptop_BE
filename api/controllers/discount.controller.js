const db = require("../config/db.js");

// ✅ Kiểm tra mã giảm giá có hợp lệ không (dùng khi user nhập mã)
exports.checkDiscount = (req, res) => {
  const { ma_gg } = req.body;
  const sql = "SELECT * FROM ma_giam_gia WHERE ma_gg = ? AND an_hien = 1";

  db.query(sql, [ma_gg], (err, result) => {
    if (err) return res.status(500).json({ error: "Lỗi server" });
    if (result.length === 0) return res.status(400).json({ error: "Mã không tồn tại" });

    const discount = result[0];
    const now = new Date();
    const startDate = new Date(discount.ngay_bat_dau);
    const endDate = new Date(discount.ngay_ket_thuc);

    if (now < startDate || now > endDate) {
      return res.status(400).json({ error: "Mã giảm giá đã hết hạn hoặc chưa bắt đầu" });
    }

    if (discount.so_lan_nhap <= 0) {
      // ✅ Nếu hết lượt thì tự động ẩn mã
      const updateSql = "UPDATE ma_giam_gia SET an_hien = 0 WHERE id_gg = ?";
      db.query(updateSql, [discount.id_gg], (updateErr) => {
        if (updateErr) console.error("❌ Lỗi khi ẩn mã:", updateErr);
      });

      return res.status(400).json({ error: "Mã giảm giá đã hết lượt sử dụng" });
    }

    // ✅ Mã hợp lệ
    res.json({ success: true, gia_tri: discount.gia_tri });
  });
};

// ✅ Lấy tất cả mã giảm giá còn hiệu lực (để hiện ở giao diện người dùng)
exports.getAllDiscounts = (req, res) => {
  const now = new Date().toISOString().split("T")[0];

  const sql = `
    SELECT * FROM ma_giam_gia
    WHERE ngay_bat_dau <= ? AND ngay_ket_thuc >= ? AND so_lan_nhap > 0 AND an_hien = 1
    ORDER BY id_gg DESC
  `;

  db.query(sql, [now, now], (err, result) => {
    if (err) {
      console.error("❌ Lỗi lấy danh sách mã giảm giá:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }

    res.json(result);
  });
};





exports.saveDiscountForUser = (req, res) => {
  const { id_kh, id_gg } = req.body;
  if (!id_kh || !id_gg) return res.status(400).json({ error: "Thiếu thông tin" });

  const sql = "INSERT INTO voucher_user (id_kh, id_gg) VALUES (?, ?)";

  db.query(sql, [id_kh, id_gg], (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "Mã đã được lưu trước đó" });
      }
      return res.status(500).json({ error: "Lỗi server" });
    }
    res.json({ success: true, message: "Đã lưu mã thành công!" });
  });
};

// ✅ Lấy tất cả voucher user đã lưu
exports.getUserDiscounts = (req, res) => {
  const { id_kh } = req.params;
  const sql = `
    SELECT mg.* 
    FROM voucher_user vu
    JOIN ma_giam_gia mg ON vu.id_gg = mg.id_gg
    WHERE vu.id_kh = ?
  `;
  db.query(sql, [id_kh], (err, result) => {
    if (err) return res.status(500).json({ error: "Lỗi server" });
    res.json(result);
  });
};