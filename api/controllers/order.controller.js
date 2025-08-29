  const db = require('../config/db.js');

  // Lấy danh sách đơn hàng (Admin)
exports.getOrders = (req, res) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";

  const sql = `
    SELECT 
      dh.id_dh,
      dh.ma_don_hang, 
      dh.trong_tien, 
      dh.ngay_dat, 
      dh.trang_thai,
      dh.payment_method,
      dh.ly_do_huy,  
      dh.ly_do_tra,
      dh.hinh,
      dh.video,
      kh.ho_ten AS ten_kh,
      a.SoNha, a.DiaChi, a.Tinh
    FROM donhang dh
    LEFT JOIN nguoidung kh ON dh.id_kh = kh.id_kh
    LEFT JOIN address a ON dh.dia_chi_gh = a.id
    ORDER BY dh.id_dh DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Lỗi server", error: err });

    const orders = results.map(order => ({
      ...order,
      hinh: order.hinh ? order.hinh.split(",").map(f => `${baseUrl}/uploads/returns/${f}`) : [],
      video: order.video ? order.video.split(",").map(f => `${baseUrl}/uploads/returns/${f}`) : [],
    }));

    res.json(orders);
  });
};


  // Lấy đơn hàng theo id_kh (User)
 exports.getOrdersByCustomer = (req, res) => {
  const { id_kh } = req.params;
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";

  const sql = `
    SELECT 
      dh.id_dh, 
      dh.ma_don_hang,
      dh.trong_tien, 
      dh.ngay_dat, 
      dh.trang_thai,
      dh.payment_method,
      dh.ly_do_huy,
      dh.ly_do_tra,
      dh.hinh,
      dh.video,
      m.ma_gg,
      m.gia_tri,
      a.Ho, a.Ten, a.DiaChi, a.SoNha, a.Tinh, a.SDT, a.Email,
      sp.id_sp,
      sp.ten,
      sp.hinh AS hinh_sp,
      ctdh.so_luong,
      sp.gia
    FROM donhang dh
    LEFT JOIN ma_giam_gia m ON dh.id_gg = m.id_gg
    LEFT JOIN address a ON dh.dia_chi_gh = a.id
    LEFT JOIN chitiet_donhang ctdh ON dh.id_dh = ctdh.id_dh
    LEFT JOIN sanpham sp ON ctdh.id_sp = sp.id_sp
    WHERE dh.id_kh = ?
    ORDER BY dh.id_dh DESC
  `;
  
  db.query(sql, [id_kh], (err, results) => {
    if (err) return res.status(500).json({ message: "Lỗi server", error: err });

    const orders = results.map(order => ({
      ...order,
      hinh: order.hinh ? order.hinh.split(",").map(f => `${baseUrl}/uploads/returns/${f}`) : [],
      video: order.video ? order.video.split(",").map(f => `${baseUrl}/uploads/returns/${f}`) : [],
    }));

    res.json(orders);
  });
};

  // Admin cập nhật trạng thái
  exports.nextStatus = (req, res) => {
  const { id } = req.params;
  const { id_nv } = req.body;

  // Lấy trạng thái hiện tại
  const getSql = `SELECT trang_thai FROM donhang WHERE id_dh = ?`;
  db.query(getSql, [id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi server", error: err });
    if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    const currentStatus = rows[0].trang_thai;
    let newStatus = currentStatus < 4 ? currentStatus + 1 : currentStatus;

    // Nếu chuyển từ 2 → 3 thì lưu cả id_nv
    let sql, params;
    if (currentStatus === 2 && newStatus === 3) {
      sql = `UPDATE donhang SET trang_thai = ?, id_nv = ? WHERE id_dh = ?`;
      params = [newStatus, id_nv, id];
    } else {
      sql = `UPDATE donhang SET trang_thai = ? WHERE id_dh = ?`;
      params = [newStatus, id];
    }

    db.query(sql, params, (err, result) => {
      if (err) return res.status(500).json({ message: "Lỗi server", error: err });
      res.json({ message: "Cập nhật trạng thái thành công", newStatus });
    });
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
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";

  // Lấy thông tin đơn hàng + người dùng
  const orderSql = `
    SELECT 
      dh.id_dh,
      dh.ma_don_hang,
      dh.ngay_dat,
      dh.trang_thai,
      dh.trong_tien,
      dh.payment_method, 
      dh.ly_do_huy,   
      dh.ly_do_tra,  
      dh.hinh,
      dh.video,
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

    // Map URL hình ảnh và video trả hàng
    order.hinh = order.hinh ? order.hinh.split(",").map(f => `${baseUrl}/uploads/returns/${f}`) : [];
    order.video = order.video ? order.video.split(",").map(f => `${baseUrl}/uploads/returns/${f}`) : [];

    db.query(detailSql, [id_dh], (err, detailResults) => {
      if (err) return res.status(500).json({ message: "Lỗi khi lấy chi tiết đơn hàng", error: err });

      res.json({
        order,
        items: detailResults
      });
    });
  });
};

  // Hủy Hàng
  exports.cancelOrder = (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || reason.trim() === "") {
    return res.status(400).json({ message: "Vui lòng nhập lý do hủy" });
  }

  const sql = `
    UPDATE donhang 
    SET trang_thai = 7, ly_do_huy = ?
    WHERE id_dh = ? AND trang_thai = 1
  `;

  db.query(sql, [reason, id], (err, result) => {
    if (err) return res.status(500).json({ message: "Lỗi server", error: err });
    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Đơn hàng không thể hủy" });
    }
    res.json({ message: "Hủy đơn hàng thành công" });
  });
};


// Trả Hàng
exports.returnOrder = (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const images = (req.files && req.files["images"]) ? req.files["images"] : [];
  const videos = (req.files && req.files["videos"]) ? req.files["videos"] : [];
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";

  if (!reason || reason.trim() === "") {
    return res.status(400).json({ message: "Vui lòng nhập lý do trả hàng" });
  }

  const imagePaths = images.map(f => f.filename).join(",");
  const videoPaths = videos.map(f => f.filename).join(",");

  const sql = `
    UPDATE donhang
    SET trang_thai = 6,
        ly_do_tra = ?,
        hinh = ?,
        video = ?
    WHERE id_dh = ? AND trang_thai = 4
  `;

  db.query(sql, [reason, imagePaths, videoPaths, id], (err, result) => {
    if (err) return res.status(500).json({ message: "Lỗi server", error: err });
    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Đơn hàng không thể trả" });
    }

    res.json({
      message: "Đơn hàng đã được trả",
      hinh: imagePaths ? imagePaths.split(",").map(f => `${baseUrl}/uploads/returns/${f}`) : [],
      video: videoPaths ? videoPaths.split(",").map(f => `${baseUrl}/uploads/returns/${f}`) : [],
    });
  });
};


exports.completeOrder = (req, res) => {
  const { id } = req.params;

  const sql = `
    UPDATE donhang
    SET trang_thai = 5
    WHERE id_dh = ? AND trang_thai = 4
  `;

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Lỗi server", error: err });
    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Đơn hàng không thể xác nhận hoàn thành" });
    }
    res.json({ message: "Xác nhận hoàn thành đơn hàng thành công" });
  });
};