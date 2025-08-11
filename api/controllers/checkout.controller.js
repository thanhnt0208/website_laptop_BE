const db = require("../config/db.js");

// ✅ Tạo địa chỉ giao hàng
exports.createAddress = (req, res) => {
  const { Ho, Ten, QuocGia, DiaChi, SoNha, Tinh, SDT, Email } = req.body;

  if (!Ho || !Ten || !DiaChi || !SDT || !Email) {
    return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
  }

  const sql = `
    INSERT INTO address (Ho, Ten, QuocGia, DiaChi, SoNha, Tinh, SDT, Email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [Ho, Ten, QuocGia, DiaChi, SoNha, Tinh, SDT, Email];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("❌ Lỗi lưu địa chỉ:", err);
      return res.status(500).json({ error: "Lỗi lưu địa chỉ" });
    }
    res.json({ id: result.insertId });
  });
};

// ✅ Tạo đơn hàng
exports.createOrder = (req, res) => {
  const { cart, user_id, user_type, id_address, discountValue = 0, discountCode, paymentMethod = "cod" } = req.body;

  if (!cart || cart.length === 0) {
    return res.status(400).json({ error: "Giỏ hàng trống" });
  }

  const id_nv = user_type === "nv" ? user_id : null;
  const id_kh = user_type === "kh" ? user_id : null;

  if (!id_nv && !id_kh) {
    return res.status(400).json({ error: "Loại người dùng không hợp lệ" });
  }

  const tongGoc = cart.reduce((sum, item) => {
    const gia = item.gia_km ?? item.gia;
    return sum + gia * item.quantity;
  }, 0);

  let tongTien = 0;
  let id_gg = null;

  const proceedCreateOrder = () => {
    const sqlInsertDonHang = `
      INSERT INTO donhang (id_nv, id_kh, id_gg, trang_thai, ngay_dat, trong_tien, dia_chi_gh, payment_method)
      VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)
    `;
    const params = [id_nv, id_kh, id_gg, 1, 0, id_address, paymentMethod];

    db.query(sqlInsertDonHang, params, (err, result) => {
      if (err) {
        console.error("❌ Lỗi tạo đơn hàng:", err);
        return res.status(500).json({ error: "Tạo đơn hàng thất bại" });
      }

      const id_dh = result.insertId;

      const insertChiTiet = (index) => {
        if (index >= cart.length) {
          const sqlUpdateTotal = `UPDATE donhang SET trong_tien = ? WHERE id_dh = ?`;
          db.query(sqlUpdateTotal, [tongTien, id_dh], (err2) => {
            if (err2) {
              console.error("❌ Lỗi cập nhật tổng tiền:", err2);
              return res.status(500).json({ error: "Cập nhật tổng tiền thất bại" });
            }

            if (id_gg) {
              const sqlUpdateDiscount = `
                UPDATE ma_giam_gia SET so_lan_nhap = so_lan_nhap - 1
                WHERE id_gg = ? AND so_lan_nhap > 0
              `;
              db.query(sqlUpdateDiscount, [id_gg], (err3) => {
                if (err3) {
                  console.error("❌ Lỗi trừ lượt mã giảm giá:", err3);
                }
              });
            }

            return res.json({ message: "Đặt hàng thành công", id_dh });
          });
          return;
        }

        const item = cart[index];
        const don_gia = item.gia_km ?? item.gia;
        const goc_tien = don_gia * item.quantity;
        const discountRatio = tongGoc > 0 ? goc_tien / tongGoc : 0;
        const giam_gia_item = Math.round(discountValue * discountRatio);
        const thanh_tien = Math.max(goc_tien - giam_gia_item, 0);

        tongTien += thanh_tien;

        const sqlInsertDetail = `
          INSERT INTO chitiet_donhang (id_sp, id_dh, so_luong, don_gia, thanh_tien)
          VALUES (?, ?, ?, ?, ?)
        `;

        db.query(sqlInsertDetail, [item.id_sp, id_dh, item.quantity, don_gia, thanh_tien], (err3) => {
          if (err3) {
            console.error("❌ Lỗi thêm chi tiết đơn hàng:", err3);
            return res.status(500).json({ error: "Thêm chi tiết đơn hàng thất bại" });
          }

          // ✅ Trừ số lượng tồn kho
          const sqlUpdateStock = `
            UPDATE sanpham
            SET so_luong = GREATEST(so_luong - ?, 0)
            WHERE id_sp = ?
          `;
          db.query(sqlUpdateStock, [item.quantity, item.id_sp], (err4) => {
            if (err4) {
              console.error("❌ Lỗi trừ số lượng sản phẩm:", err4);
              // Không dừng đơn hàng nếu lỗi ở đây
            }

            insertChiTiet(index + 1); // Tiếp tục sản phẩm tiếp theo
          });
        });
      };

      insertChiTiet(0); // Bắt đầu với sản phẩm đầu tiên
    });
  };

  if (discountCode) {
    const sqlSelectDiscount = `
      SELECT id_gg, so_lan_nhap FROM ma_giam_gia
      WHERE ma_gg = ? AND so_lan_nhap > 0
    `;
    db.query(sqlSelectDiscount, [discountCode], (err, results) => {
      if (err) {
        console.error("❌ Lỗi truy vấn mã giảm giá:", err);
        return res.status(500).json({ error: "Lỗi truy vấn mã giảm giá" });
      }

      if (results.length > 0) {
        id_gg = results[0].id_gg;
        proceedCreateOrder();
      } else {
        return res.status(400).json({ error: "Mã giảm giá không hợp lệ hoặc đã hết lượt dùng" });
      }
    });
  } else {
    proceedCreateOrder();
  }
};

// ✅ Lấy đơn hàng theo id khách hàng
exports.getOrdersByCustomerId = (req, res) => {
  const id_kh = req.params.id_kh;
  const sql = "SELECT * FROM donhang WHERE id_kh = ?";
  db.query(sql, [id_kh], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// ✅ Lấy danh sách địa chỉ đã dùng của khách hàng
exports.getUsedAddresses = (req, res) => {
  const id_kh = req.params.id_kh;
  const sql = `
    SELECT 
      MIN(a.id) AS id,
      a.Ho, a.Ten, a.TenCTY, a.QuocGia,
      a.DiaChi, a.SoNha, a.MaBuuDien,
      a.Tinh, a.SDT, a.Email
    FROM donhang d
    JOIN address a ON d.dia_chi_gh = a.id
    WHERE d.id_kh = ?
    GROUP BY 
      a.Ho, a.Ten, a.TenCTY, a.QuocGia,
      a.DiaChi, a.SoNha, a.MaBuuDien,
      a.Tinh, a.SDT, a.Email
    ORDER BY MAX(d.ngay_dat) DESC
  `;

  db.query(sql, [id_kh], (err, results) => {
    if (err) {
      console.error("❌ Lỗi khi lấy địa chỉ đã dùng:", err);
      return res.status(500).json({ error: "Lỗi khi lấy địa chỉ đã dùng" });
    }
    res.json(results);
  });
};
