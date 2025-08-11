const db = require('../config/db.js');

// Lấy danh sách đơn hàng (Admin)
exports.getOrders = (req, res) => {
  const sql = `
    SELECT dh.id_dh, dh.trong_tien, dh.ngay_dat, dh.trang_thai,
           kh.ho_ten AS ten_kh, kh.sdt  
    FROM donhang dh
    LEFT JOIN nguoidung kh ON dh.id_kh = kh.id_kh
    ORDER BY dh.id_dh DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Lỗi server", error: err });
    res.json(results);
  });
};

// Lấy đơn hàng theo id_kh (User)
exports.getOrdersByCustomer = (req, res) => {
  const { id_kh } = req.params;
  const sql = `
    SELECT 
      dh.id_dh, 
      dh.trong_tien, 
      dh.ngay_dat, 
      dh.trang_thai,
      dh.payment_method,
      m.ma_gg,
      m.gia_tri,
      a.Ho, a.Ten, a.DiaChi, a.SoNha, a.Tinh, a.SDT, a.Email
    FROM donhang dh
    LEFT JOIN ma_giam_gia m ON dh.id_gg = m.id_gg
    LEFT JOIN address a ON dh.dia_chi_gh = a.id
    WHERE dh.id_kh = ?
    ORDER BY dh.id_dh DESC
  `;
  db.query(sql, [id_kh], (err, results) => {
    if (err) return res.status(500).json({ message: "Lỗi server", error: err });
    res.json(results);
  });
};


// Admin cập nhật trạng thái
exports.nextStatus = (req, res) => {
  const { id } = req.params;
  const sql = `
    UPDATE donhang 
    SET trang_thai = CASE 
        WHEN trang_thai < 4 THEN trang_thai + 1
        ELSE trang_thai
      END
    WHERE id_dh = ?
  `;
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Lỗi server", error: err });
    res.json({ message: "Cập nhật trạng thái thành công" });
  });
};

// User xác nhận đã nhận hàng
exports.userConfirm = (req, res) => {
  const { id } = req.params;
  const sql = `
    UPDATE donhang 
    SET trang_thai = 4
    WHERE id_dh = ? AND trang_thai = 3
  `;
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Lỗi server", error: err });
    res.json({ message: "Xác nhận đơn hàng thành công" });
  });
};

exports.deleteOrder = (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM donhang WHERE id_dh = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Lỗi server", error: err });
    res.json({ message: "✅ Xóa đơn hàng thành công" });
  });
};

// Lấy chi tiết đơn hàng theo ID đơn hàng
exports.getOrderDetailsById = (req, res) => {
  const id_dh = req.params.id_dh;

  const sql = `
    SELECT 
      c.id_sp,
      sp.ten AS ten_sp,
      sp.hinh,
      SUM(c.so_luong) AS so_luong,
      c.don_gia,
      SUM(c.thanh_tien) AS thanh_tien
    FROM chitiet_donhang c
    LEFT JOIN sanpham sp ON c.id_sp = sp.id_sp
    WHERE c.id_dh = ?
    GROUP BY c.id_sp, c.don_gia, sp.ten, sp.hinh
  `;

  db.query(sql, [id_dh], (err, results) => {
    if (err) {
      console.error("❌ Lỗi khi lấy chi tiết đơn hàng:", err);
      return res.status(500).json({ message: "Lỗi server", error: err });
    }
    res.json(results);
  });
};
exports.getAdminOrderDetail = (req, res) => {
  const id_dh = req.params.id_dh;

  // Lấy thông tin đơn hàng + người dùng
const orderSql = `
  SELECT 
    dh.id_dh,
    dh.ngay_dat,
    dh.trang_thai,
    dh.trong_tien,
    dh.payment_method, 
    kh.ho_ten AS ten_kh,
    kh.sdt,
    kh.email,
    a.Ho,
    a.Ten,
    a.DiaChi,
    a.SoNha,
    a.Tinh,
    a.SDT AS sdt_gh,
    a.Email AS email_gh,
    m.ma_gg,
    m.gia_tri
  FROM donhang dh
  LEFT JOIN nguoidung kh ON dh.id_kh = kh.id_kh
  LEFT JOIN address a ON dh.dia_chi_gh = a.id
  LEFT JOIN ma_giam_gia m ON dh.id_gg = m.id_gg
  WHERE dh.id_dh = ?
`;



  // Lấy danh sách sản phẩm trong đơn
const detailSql = `
  SELECT 
    ct.id_sp,
    sp.ten AS ten_sp,
    sp.hinh,
    ct.so_luong,
    ct.don_gia,
    ct.thanh_tien
  FROM chitiet_donhang ct
  LEFT JOIN sanpham sp ON ct.id_sp = sp.id_sp
  WHERE ct.id_dh = ?
`;


  
  db.query(orderSql, [id_dh], (err, orderResults) => {
    if (err) return res.status(500).json({ message: "Lỗi khi lấy đơn hàng", error: err });

    if (orderResults.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const order = orderResults[0];

    db.query(detailSql, [id_dh], (err, detailResults) => {
      if (err) return res.status(500).json({ message: "Lỗi khi lấy chi tiết đơn hàng", error: err });

      res.json({
        order,
        items: detailResults
      });
    });
  });
};


