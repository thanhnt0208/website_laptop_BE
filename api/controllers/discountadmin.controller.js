const db = require("../config/db.js");

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
      // ❌ Nếu hết lượt thì cập nhật an_hien = 0
      const updateSql = "UPDATE ma_giam_gia SET an_hien = 0 WHERE id_gg = ?";
      db.query(updateSql, [discount.id_gg], (updateErr) => {
        if (updateErr) console.error("❌ Lỗi khi ẩn mã:", updateErr);
      });

      return res.status(400).json({ error: "Mã giảm giá đã hết lượt sử dụng" });
    }

    // ✅ Nếu còn lượt, trả về giá trị giảm
    res.json({ success: true, gia_tri: discount.gia_tri });
  });
};


exports.getAllDiscounts = (req, res) => {
  const sql = `SELECT * FROM ma_giam_gia ORDER BY id_gg DESC`;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("❌ Lỗi lấy danh sách mã giảm giá:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
    res.json(result);
  });
};

exports.updateDiscount = (req, res) => {
  const id = req.params.id;
  const { ma_gg, gia_tri, ngay_bat_dau, ngay_ket_thuc, so_lan_nhap, an_hien } = req.body;

  if (!ma_gg || !gia_tri || !ngay_bat_dau || !ngay_ket_thuc || !so_lan_nhap || an_hien === undefined) {
    return res.status(400).json({ error: "Thiếu thông tin để cập nhật" });
  }

  const sql = `
    UPDATE ma_giam_gia
    SET ma_gg = ?, gia_tri = ?, ngay_bat_dau = ?, ngay_ket_thuc = ?, so_lan_nhap = ?, an_hien = ?
    WHERE id_gg = ?
  `;

  const values = [ma_gg, gia_tri, ngay_bat_dau, ngay_ket_thuc, so_lan_nhap, an_hien, id];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error(" Lỗi cập nhật mã:", err);
      return res.status(500).json({ error: "Cập nhật mã thất bại" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy mã để cập nhật" });
    }

    res.json({ message: " Cập nhật mã giảm giá thành công" });
  });
};


exports.createDiscount = (req, res) => {
  const { ma_gg, gia_tri, ngay_bat_dau, ngay_ket_thuc, so_lan_nhap } = req.body;

  if (!ma_gg || !gia_tri || !ngay_bat_dau || !ngay_ket_thuc || !so_lan_nhap) {
    return res.status(400).json({ error: "Thiếu thông tin" });
  }

  const sql = `
    INSERT INTO ma_giam_gia (ma_gg, gia_tri, ngay_bat_dau, ngay_ket_thuc, so_lan_nhap, an_hien)
    VALUES (?, ?, ?, ?, ?, 1)
  `;
  const values = [ma_gg, gia_tri, ngay_bat_dau, ngay_ket_thuc, so_lan_nhap];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Lỗi thêm mã:", err);
      return res.status(500).json({ error: "Thêm mã thất bại" });
    }
    res.json({ message: "Thêm mã thành công", id: result.insertId });
  });
};

// Xoá mã giảm giá
exports.deleteDiscount = (req, res) => {
  const id = req.params.id;
  const sql = "UPDATE ma_giam_gia SET an_hien = 0 WHERE id_gg = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: "Lỗi khi ẩn mã" });
    res.json({ message: "Ẩn mã giảm giá thành công" });
  });
};

// Toggle ẩn/hiện mã giảm giá
exports.toggleDiscountVisibility = (req, res) => {
  const { id } = req.params;
  const { an_hien } = req.body; // 1 = hiện, 0 = ẩn

  if (![0, 1].includes(an_hien)) {
    return res.status(400).json({ error: "Trạng thái an_hien không hợp lệ" });
  }

  const sql = "UPDATE ma_giam_gia SET an_hien = ? WHERE id_gg = ?";
  db.query(sql, [an_hien, id], (err, result) => {
    if (err) return res.status(500).json({ error: "Lỗi khi cập nhật trạng thái" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy mã giảm giá" });
    }

    res.json({ message: an_hien === 1 ? "Hiện mã giảm giá thành công" : "Ẩn mã giảm giá thành công" });
  });
};
