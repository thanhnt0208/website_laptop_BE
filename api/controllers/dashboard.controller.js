const db = require('../config/db.js');


// Lấy tổng số đơn hàng trong tháng
exports.getTotalOrdersThisMonth = (req, res) => {
  const sql = `
    SELECT COUNT(*) AS total_orders
    FROM donhang
    WHERE MONTH(ngay_dat) = MONTH(CURDATE())
      AND YEAR(ngay_dat) = YEAR(CURDATE())
      AND trang_thai = 4
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ tong_don: result[0].total_orders });
  });
};

exports.getTotalOrdersLast3Months = (req, res) => {
  const sql = `
    SELECT COUNT(*) AS total_orders
    FROM donhang
    WHERE ngay_dat >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
    AND trang_thai = 4
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ tong_don_3_thang: result[0].total_orders });
  });
};

exports.getTotalRevenueThisMonth = (req, res) => {
  const sql = `
    SELECT SUM(trong_tien) AS total_revenue
    FROM donhang
    WHERE MONTH(ngay_dat) = MONTH(CURDATE())
      AND YEAR(ngay_dat) = YEAR(CURDATE())
      AND trang_thai = 4
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ doanh_thu_thang: result[0].total_revenue || 0 });
  });
};

exports.getTotalRevenueLast3Months = (req, res) => {
  const sql = `
    SELECT SUM(trong_tien) AS total_revenue
    FROM donhang
    WHERE ngay_dat >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
      AND trang_thai = 4
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ doanh_thu_3_thang: result[0].total_revenue || 0 });
  });
};

exports.getRevenueByDayThisMonth = (req, res) => {
  const sql = `
    SELECT DAY(ngay_dat) AS day, SUM(trong_tien) AS revenue
    FROM donhang
    WHERE MONTH(ngay_dat) = MONTH(CURDATE())
      AND YEAR(ngay_dat) = YEAR(CURDATE())
      AND trang_thai = 4
    GROUP BY DAY(ngay_dat)
    ORDER BY day
  `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    // Tạo mảng 31 phần tử ban đầu là 0
    const revenueData = Array(31).fill(0);
    result.forEach(row => {
      revenueData[row.day - 1] = row.revenue;
    });

    res.json({ revenueByDay: revenueData });
  });
};

exports.getBestSellingProductsThisMonth = (req, res) => {
  const sql = `
    SELECT sp.ten, SUM(ct.so_luong) AS so_luong_ban
      FROM chitiet_donhang ct
      JOIN donhang dh ON dh.id_dh = ct.id_dh
      JOIN sanpham sp ON sp.id_sp = ct.id_sp
      WHERE MONTH(dh.ngay_dat) = MONTH(CURDATE())
        AND YEAR(dh.ngay_dat) = YEAR(CURDATE())
      GROUP BY sp.id_sp
      ORDER BY so_luong_ban DESC
      LIMIT 10
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ bestSelling: result });
  });
};

exports.getBestSellingProductsLast3Months = (req, res) => {
  const sql = `
    SELECT sp.ten, SUM(ct.so_luong) AS so_luong_ban
    FROM chitiet_donhang ct
    JOIN donhang dh ON dh.id_dh = ct.id_dh
    JOIN sanpham sp ON sp.id_sp = ct.id_sp
    WHERE dh.ngay_dat >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
      AND dh.trang_thai = 4
    GROUP BY sp.id_sp
    ORDER BY so_luong_ban DESC
    LIMIT 10
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ bestSelling3Months: result });
  });
};