const db = require("../config/db.js");

const getHomeProducts = (req, res) => {
  const spbanchay = `SELECT id_sp, ten, gia, gia_km, hinh, slug ,luot_mua ,luot_xem
                    FROM sanpham 
                    WHERE an_hien = 1 
                    ORDER BY luot_mua DESC 
                    LIMIT 4`;

  const spview = `SELECT id_sp, ten, gia, gia_km, hinh, slug ,luot_xem, luot_mua
                FROM sanpham 
                WHERE an_hien = 1 
                ORDER BY luot_xem + luot_mua DESC 
                LIMIT 4`;

  const spmoi = `SELECT id_sp, ten, gia, gia_km, hinh, slug, luot_xem, luot_mua
                  FROM sanpham
                  WHERE an_hien = 1
                  ORDER BY (luot_xem + luot_mua) DESC
                  LIMIT 4;
                  `;
  const spgiamgia = `SELECT id_sp, ten, gia, gia_km, hinh, slug , luot_xem, luot_mua
                     FROM sanpham 
                     WHERE an_hien = 1 AND gia_km < gia 
                     ORDER BY ngay ASC 
                     LIMIT 8`;

  db.query(spbanchay, (err, hot) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(spview, (err, view) => {
      if (err) return res.status(500).json({ error: err.message });

      db.query(spmoi, (err, moi) => {
        if (err) return res.status(500).json({ error: err.message });

        db.query(spgiamgia, (err, giamgia) => {
          if (err) return res.status(500).json({ error: err.message });

          res.json({
            hot: hot,
            view: view,
            moi: moi,
            giamgia: giamgia,
          });
        });
      });
    });
  });
};

module.exports = { getHomeProducts };
