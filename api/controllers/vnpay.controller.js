const db = require('../config/db');
const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');

const vnpay = new VNPay({
  tmnCode: 'MGLAZ8F7',
  secureSecret: '3VOOI2ODW0OXAUNMZADI52VT2O3HANRQ',
  vnpayHost: 'https://sandbox.vnpayment.vn',
  testMode: true,
  hashAlgorithm: 'SHA512',
  loggerFn: ignoreLogger,
});

// ✅ Lưu đơn hàng trước khi thanh toán VNPay
const createOrderBeforeVNPay = (req, callback) => {
  const { cart, user_id, id_address, discountValue = 0, discountCode } = req.body;

  const id_kh = user_id; // 👈 dùng khách hàng
  const id_nv = null;

  const tongGoc = cart.reduce((sum, item) => {
    const gia = item.gia_km ?? item.gia;
    return sum + gia * item.quantity;
  }, 0);

  let tongTien = 0;
  let id_gg = null;

  const proceed = () => {
    const sql = `INSERT INTO donhang (id_nv, id_kh, id_gg, trang_thai, ngay_dat, trong_tien, dia_chi_gh, payment_method)
             VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)`;
    db.query(sql, [id_nv, id_kh, id_gg, 0, 0, id_address, "VNPAY"], (err, result) => {
      if (err) return callback(err);

      const id_dh = result.insertId;

      const insertChiTiet = (i) => {
        if (i >= cart.length) {
          const sqlUpdate = `UPDATE donhang SET trong_tien = ? WHERE id_dh = ?`;
          db.query(sqlUpdate, [tongTien, id_dh], () => callback(null, id_dh));
          return;
        }

        const item = cart[i];
        const don_gia = item.gia_km ?? item.gia;
        const goc_tien = don_gia * item.quantity;
        const ratio = tongGoc > 0 ? goc_tien / tongGoc : 0;
        const giam = Math.round(discountValue * ratio);
        const thanh_tien = Math.max(goc_tien - giam, 0);
        tongTien += thanh_tien;

        const sqlCT = `INSERT INTO chitiet_donhang (id_sp, id_dh, so_luong, don_gia, thanh_tien)
                       VALUES (?, ?, ?, ?, ?)`;
        db.query(sqlCT, [item.id_sp, id_dh, item.quantity, don_gia, thanh_tien], () =>
          insertChiTiet(i + 1)
        );
      };
        
      insertChiTiet(0);
    });
  };

  if (discountCode) {
    db.query('SELECT * FROM ma_giam_gia WHERE ma_gg = ? AND so_lan_nhap > 0', [discountCode], (err, rs) => {
      if (rs.length > 0) id_gg = rs[0].id_gg;
      proceed();
    });
  } else {
    proceed();
  }
};



// ✅ Gọi VNPay sau khi tạo đơn
exports.createPayment = (req, res) => {
  createOrderBeforeVNPay(req, async (err, id_dh) => {
    if (err) return res.status(500).json({ error: 'Tạo đơn hàng thất bại' });

    const { amount, info } = req.body;
    const txnRef = `${Date.now()}-${id_dh}`;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const paymentUrl = await vnpay.buildPaymentUrl({
      vnp_Amount: amount * 100 / 100,
      vnp_IpAddr: req.ip || '127.0.0.1',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: info,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: `http://localhost:3000/api/vnpay/return`,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    res.status(200).json({ url: paymentUrl });
  });
};

// ✅ Cập nhật trạng thái đơn hàng sau khi thanh toán
exports.paymentReturn = (req, res) => {
  const vnp_TxnRef = req.query.vnp_TxnRef;
  const id_dh = parseInt(vnp_TxnRef.split("-")[1]);

  if (!id_dh) {
    return res.status(400).send("Thiếu mã đơn hàng");
  }

  // ✅ 1. Cập nhật trạng thái đơn hàng thành "đã thanh toán"
  const sqlUpdateStatus = `UPDATE donhang SET trang_thai = 1 WHERE id_dh = ?`;

  db.query(sqlUpdateStatus, [id_dh], (err) => {
    if (err) {
      console.error("❌ Cập nhật trạng thái đơn hàng thất bại:", err);
      return res.status(500).send("Lỗi cập nhật trạng thái đơn hàng");
    }

    // ✅ 2. Lấy danh sách sản phẩm trong đơn hàng
    const sqlGetDetails = `SELECT id_sp, so_luong FROM chitiet_donhang WHERE id_dh = ?`;
    db.query(sqlGetDetails, [id_dh], (err2, items) => {
      if (err2) {
        console.error("❌ Lỗi truy vấn chi tiết đơn hàng:", err2);
        return res.status(500).send("Lỗi chi tiết đơn hàng");
      }

      if (items.length === 0) {
        console.warn("⚠️ Không có sản phẩm nào trong đơn hàng");
        return res.redirect("http://localhost:3001/checkout-success");
      }

      // ✅ 3. Trừ tồn kho từng sản phẩm
      const updateStock = (i) => {
        if (i >= items.length) {
          // Khi trừ xong kho -> Kiểm tra mã giảm giá
          return updateDiscountIfExists();
        }

        const item = items[i];
        const sqlUpdateStock = `
          UPDATE sanpham
          SET so_luong = GREATEST(so_luong - ?, 0)
          WHERE id_sp = ?
        `;
        db.query(sqlUpdateStock, [item.so_luong, item.id_sp], (err3) => {
          if (err3) {
            console.error(`❌ Lỗi trừ số lượng sản phẩm ID ${item.id_sp}:`, err3);
          }
          updateStock(i + 1); // tiếp tục sản phẩm tiếp theo
        });
      };

      updateStock(0);
    });

    // ✅ 4. Trừ lượt mã giảm giá nếu có
    const updateDiscountIfExists = () => {
      const sqlGetDiscount = `SELECT id_gg FROM donhang WHERE id_dh = ? AND id_gg IS NOT NULL`;

      db.query(sqlGetDiscount, [id_dh], (err4, rows) => {
        if (err4) {
          console.error("❌ Lỗi khi kiểm tra mã giảm giá:", err4);
          return res.redirect("http://localhost:3001");
        }

        if (rows.length > 0) {
          const id_gg = rows[0].id_gg;
          const sqlUpdateDiscount = `
            UPDATE ma_giam_gia
            SET so_lan_nhap = GREATEST(so_lan_nhap - 1, 0)
            WHERE id_gg = ?
          `;
          db.query(sqlUpdateDiscount, [id_gg], (err5) => {
            if (err5) {
              console.error("❌ Lỗi trừ lượt mã giảm giá:", err5);
            }
            return res.redirect("http://localhost:3001");
          });
        } else {
          return res.redirect("http://localhost:3001");
        }
      });
    };
  });
};


