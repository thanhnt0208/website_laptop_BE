const db = require('../config/db.js');

// Tổng đơn hàng của 1 tháng cụ thể
  exports.getTotalOrdersThisMonth = (req, res) => {
    const { year, month, status } = req.query;
    if (!year || !month) return res.status(400).json({ error: "Missing 'year' or 'month' parameter" });

    let statusCondition = "";
    if (status && status !== "all") {
      statusCondition = `AND trang_thai = ${db.escape(status)}`;
    }
    const sql = `
      SELECT COUNT(*) AS total_orders
      FROM donhang
      WHERE MONTH(ngay_dat) = ?
        AND YEAR(ngay_dat) = ?
        ${statusCondition}
    `;
    db.query(sql, [month, year], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ tong_don: result[0].total_orders });
    });
  };

  // Tổng đơn hàng 3 tháng gần nhất (không bị mất dữ liệu qua năm)
  exports.getTotalOrdersLast3Months = (req, res) => {
    let { year, month, status } = req.query;
    if (!year || !month) {
      return res.status(400).json({ error: "Missing 'year' or 'month' parameter" });
    }

    let startMonth, endMonth;
    if (month >= 1 && month <= 3) {
      startMonth = 1; endMonth = 3;
    } else if (month >= 4 && month <= 6) {
      startMonth = 4; endMonth = 6;
    } else if (month >= 7 && month <= 9) {
      startMonth = 7; endMonth = 9;
    } else {
      startMonth = 10; endMonth = 12;
    }

    let statusCondition = "";
    if (status && status !== "all") {
      statusCondition = `AND trang_thai = ${db.escape(status)}`;
    }

    const sql = `
        SELECT MONTH(ngay_dat) AS month, COUNT(*) AS total_orders
        FROM donhang
        WHERE YEAR(ngay_dat) = ? 
          AND MONTH(ngay_dat) BETWEEN ? AND ?
          ${statusCondition}
        GROUP BY MONTH(ngay_dat)
    `;
    db.query(sql, [year, startMonth, endMonth], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      const totalOrders = result.reduce((sum, row) => sum + row.total_orders, 0);
      res.json({ total_orders: totalOrders });
    });
  };

// Doanh thu của 1 tháng cụ thể
exports.getTotalRevenueThisMonth = (req, res) => {
  const { year, month } = req.query;
  if (!year || !month) return res.status(400).json({ error: "Missing 'year' or 'month' parameter" });

  const sql = `
    SELECT SUM(trong_tien) AS total_revenue
    FROM donhang
    WHERE MONTH(ngay_dat) = ?
      AND YEAR(ngay_dat) = ?
      AND trang_thai = 5
  `;
  db.query(sql, [month, year], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ doanh_thu_thang: result[0].total_revenue || 0 });
  });
};
// Doanh thu 3 tháng gần nhất
exports.getTotalRevenueLast3Months = (req, res) => {
 const { year, month } = req.query;
  if (!year || !month) return res.status(400).json({ error: "Missing 'year' or 'month' parameter" });
  let startMonth, endMonth;
  if (month >= 1 && month <= 3) {
    startMonth = 1; endMonth = 3;
  } else if (month >= 4 && month <= 6) {
    startMonth = 4; endMonth = 6;
  } else if (month >= 7 && month <= 9) {
    startMonth = 7; endMonth = 9;
  } else {
    startMonth = 10; endMonth = 12;
  }
  const sql = `
    SELECT SUM(trong_tien) AS total_revenue
    FROM donhang
    WHERE MONTH(ngay_dat) BETWEEN ? AND ?
      AND YEAR(ngay_dat) = ?
      AND trang_thai = 5
  `;
  db.query(sql, [startMonth, endMonth, year ], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ doanh_thu_3_thang: result[0].total_revenue || 0 });
  });
};

// Doanh thu theo ngày trong tháng
exports.getRevenueByDayThisMonth = (req, res) => {
  const { year, month } = req.query;
  if (!year || !month) return res.status(400).json({ error: "Missing 'year' or 'month' parameter" });

  const sql = `
    SELECT DAY(ngay_dat) AS day, SUM(trong_tien) AS revenue
    FROM donhang
    WHERE MONTH(ngay_dat) = ?
      AND YEAR(ngay_dat) = ?
      AND trang_thai = 5
    GROUP BY DAY(ngay_dat)
    ORDER BY day
  `;
  db.query(sql, [month, year], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const revenueData = Array(31).fill(0);
    result.forEach(row => {
      revenueData[row.day - 1] = row.revenue;
    });

    res.json({ revenueByDay: revenueData });
  });
};

// Top sản phẩm bán chạy trong tháng
exports.getBestSellingProductsThisMonth = (req, res) => {
  const { year, month, status } = req.query;
  if (!year || !month) {
    return res.status(400).json({ error: "Missing 'year' or 'month' parameter" });
  }

  // Nếu có status khác 'all' thì thêm vào WHERE
  let statusCondition = "";
  if (status && status !== "all") {
    statusCondition = `AND dh.trang_thai = ${db.escape(status)}`;
  }
  const sql = `
    SELECT sp.ten, SUM(ct.so_luong) AS so_luong_ban
    FROM chitiet_donhang ct
    JOIN donhang dh ON dh.id_dh = ct.id_dh
    JOIN sanpham sp ON sp.id_sp = ct.id_sp
    WHERE MONTH(dh.ngay_dat) = ?
      AND YEAR(dh.ngay_dat) = ?
      ${statusCondition}
    GROUP BY sp.id_sp
    ORDER BY so_luong_ban DESC
    LIMIT 10
  `;

  db.query(sql, [month, year], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ bestSelling: result });
  });
};

// Top sản phẩm bán chạy 3 tháng 
exports.getBestSellingProductsLast3Months = (req, res) => {
  const { year, month, status } = req.query;
  if (!year || !month) {
    return res.status(400).json({ error: "Missing 'year' or 'month' parameter" });
  }

  let startMonth, endMonth;
  if (month >= 1 && month <= 3) {
    startMonth = 1; endMonth = 3;
  } else if (month >= 4 && month <= 6) {
    startMonth = 4; endMonth = 6;
  } else if (month >= 7 && month <= 9) {
    startMonth = 7; endMonth = 9;
  } else {
    startMonth = 10; endMonth = 12;
  }

  let statusCondition = "";
  if (status && status !== "all") {
    statusCondition = `AND dh.trang_thai = ${db.escape(status)}`;
  }

  const sql = `
    SELECT sp.ten, SUM(ct.so_luong) AS so_luong_ban
    FROM chitiet_donhang ct
    JOIN donhang dh ON dh.id_dh = ct.id_dh
    JOIN sanpham sp ON sp.id_sp = ct.id_sp
    WHERE YEAR(dh.ngay_dat) = ?
      AND MONTH(dh.ngay_dat) BETWEEN ? AND ?
      ${statusCondition}
    GROUP BY sp.id_sp
    ORDER BY so_luong_ban DESC
    LIMIT 10
  `;

  db.query(sql, [year, startMonth, endMonth], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ bestSelling3Months: result });
  });
};


exports.getPackedOrdersByEmployeeThisMonth = (req, res) => {
  const { year, month } = req.query;
  if (!year || !month) {
    return res.status(400).json({ error: "Missing 'year' or 'month' parameter" });
  }

  const sql = `
    SELECT nv.ho_ten AS nhan_vien, COUNT(dh.id_dh) AS so_don_dong_goi
    FROM donhang dh
    JOIN nhanvien nv ON nv.id_nv = dh.id_nv
    WHERE MONTH(dh.ngay_dat) = ?
      AND YEAR(dh.ngay_dat) = ?
      AND dh.trang_thai = 3
    GROUP BY nv.id_nv
    ORDER BY so_don_dong_goi DESC
  `;

  db.query(sql, [month, year], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ packedByEmployee: result });
  });
};

exports.getPackedOrdersByEmployeeLast3Months = (req, res) => {
  const { year, month } = req.query;
  if (!year || !month) {
    return res.status(400).json({ error: "Missing 'year' or 'month' parameter" });
  }

  let startMonth, endMonth;
  if (month >= 1 && month <= 3) {
    startMonth = 1; endMonth = 3;
  } else if (month >= 4 && month <= 6) {
    startMonth = 4; endMonth = 6;
  } else if (month >= 7 && month <= 9) {
    startMonth = 7; endMonth = 9;
  } else {
    startMonth = 10; endMonth = 12;
  }

  const sql = `
    SELECT nv.ho_ten AS nhan_vien, COUNT(dh.id_dh) AS so_don_dong_goi
    FROM donhang dh
    JOIN nhanvien nv ON nv.id_nv = dh.id_nv
    WHERE MONTH(dh.ngay_dat) BETWEEN ? AND ?
      AND YEAR(dh.ngay_dat) = ?
      AND dh.trang_thai = 3
    GROUP BY nv.id_nv
    ORDER BY so_don_dong_goi DESC
  `;

  db.query(sql, [startMonth, endMonth, year], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ packedByEmployee3Months: result });
  });
};
