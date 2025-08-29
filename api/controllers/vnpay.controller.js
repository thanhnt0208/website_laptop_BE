// vnpayController.js
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

// ==========================
// Tạo link thanh toán
// ==========================
exports.createPayment = async (req, res) => {
  try {
    const { amount, info, user_id, id_address, cart, discountValue = 0, discountCode } = req.body;

    const txnRef = `${Date.now()}-${user_id}`;
    global.tempOrders = global.tempOrders || {};
    global.tempOrders[txnRef] = {
      user_id,
      id_address,
      cart,
      discountValue,
      discountCode,
      createdAt: new Date(),
      status: 'pending'
    };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const paymentUrl = await vnpay.buildPaymentUrl({
      vnp_Amount: amount * 100 /100, // VNPay yêu cầu đơn vị là đồng * 100
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Tạo link VNPay thất bại' });
  }
};


exports.paymentReturn = (req, res) => {
  try {
    const { vnp_TxnRef, vnp_ResponseCode } = req.query;
    const orderTemp = global.tempOrders?.[vnp_TxnRef];

    if (!orderTemp) {
      return res.status(400).send("Không tìm thấy dữ liệu đơn hàng tạm");
    }

    if (vnp_ResponseCode !== '00') {
      orderTemp.status = 'failed';
      return res.redirect(`http://localhost:3001/checkout?status=failed&orderId=${vnp_TxnRef}`);
    }

    const { user_id, id_address, cart, discountValue, discountCode } = orderTemp;
    const id_nv = null;
    const id_kh = user_id;
    let tongTien = 0;
    let id_gg = null;

    const tongGoc = cart.reduce((sum, item) => {
      const gia = item.gia_km ?? item.gia;
      return sum + gia * item.quantity;
    }, 0);

    const saveOrder = () => {
      const sql = `INSERT INTO donhang (id_nv, id_kh, id_gg, trang_thai, ngay_dat, trong_tien, dia_chi_gh, payment_method)
                   VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)`;
      db.query(sql, [id_nv, id_kh, id_gg, 1, 0, id_address, "VNPAY"], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Lưu đơn hàng thất bại");
        }

        const id_dh = result.insertId;

       const now = new Date();
      const maDonHang = `BMB${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}-${id_dh}`;
      db.query(`UPDATE donhang SET ma_don_hang = ? WHERE id_dh = ?`, [maDonHang, id_dh]);


        // 🔹 Trừ lượt dùng mã giảm giá nếu có
        if (discountCode) {
          db.query(
            `UPDATE ma_giam_gia SET so_lan_nhap = so_lan_nhap - 1 
             WHERE ma_gg = ? AND so_lan_nhap > 0`,
            [discountCode],
            (err2) => {
              if (err2) console.error("Lỗi trừ lượt mã giảm giá:", err2);
            }
          );
        }

        const insertChiTiet = (i) => {
          if (i >= cart.length) {
            db.query(`UPDATE donhang SET trong_tien = ? WHERE id_dh = ?`, [tongTien, id_dh], () => {
              delete global.tempOrders[vnp_TxnRef];
              db.query(`DELETE FROM giohang WHERE id_kh = ?`, [id_kh], () => {
                res.redirect("http://localhost:3001/checkout?status=success");
              });
            });
            return;
          }

          const item = cart[i];
          const don_gia = item.gia_km ?? item.gia;
          const goc_tien = don_gia * item.quantity;
          const ratio = tongGoc > 0 ? goc_tien / tongGoc : 0;
          const giam = Math.round(discountValue * ratio);
          const thanh_tien = Math.max(goc_tien - giam, 0);
          tongTien += thanh_tien;

          db.query(
            `INSERT INTO chitiet_donhang (id_sp, id_dh, so_luong, don_gia, thanh_tien)
             VALUES (?, ?, ?, ?, ?)`,
            [item.id_sp, id_dh, item.quantity, don_gia, thanh_tien],
            (err3) => {
              if (err3) console.error("Lỗi thêm chi tiết:", err3);

              db.query(
                `UPDATE sanpham SET so_luong = so_luong - ? WHERE id_sp = ? AND so_luong >= ?`,
                [item.quantity, item.id_sp, item.quantity],
                (err4) => {
                  if (err4) console.error("Lỗi trừ số lượng sp:", err4);
                  insertChiTiet(i + 1);
                }
              );
            }
          );
        };

        insertChiTiet(0);
      });
    };

    // Lấy id_gg nếu có
    if (discountCode) {
      db.query('SELECT * FROM ma_giam_gia WHERE ma_gg = ? AND so_lan_nhap > 0', [discountCode], (err, rs) => {
        if (rs.length > 0) id_gg = rs[0].id_gg;
        saveOrder();
      });
    } else {
      saveOrder();
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Lỗi xử lý thanh toán");
  }
};


// API lấy lại đơn hàng tạm
exports.getTempOrder = (req, res) => {
  const { orderId } = req.query;
  if (global.tempOrders && global.tempOrders[orderId]) {
    return res.json(global.tempOrders[orderId]);
  }
  res.status(404).json({ error: "Không tìm thấy đơn hàng tạm" });
};


