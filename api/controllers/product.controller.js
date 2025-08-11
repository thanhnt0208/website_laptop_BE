const db = require("../config/db.js");

// Lấy tất cả products
exports.getProducts = (req, res) => {
  db.query("SELECT * FROM sanpham", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};
// lấy 1 sản phẩm
exports.getProductBySlug = (req, res) => {
  const slug = req.params.slug;

  db.query("SELECT * FROM sanpham WHERE slug = ? AND an_hien=1", [slug], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    res.json(result[0]); // Trả về sản phẩm đầu tiên (vì slug là duy nhất)
  });
};
// lấy sản phẩm theo id category
exports.getProductByIdCategory = (req, res) => {
  const categoryId = req.params.id_loai;
  const sql = ("SELECT * FROM sanpham WHERE id_dm = ? AND an_hien=1");
  db.query(sql, [categoryId], (err, data) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (data.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm trong danh mục này" });
    }

    res.json(data);
  });
};
// lấy sản phẩm liên quan
exports.getProductRelated = (req, res) => {
  const slug = req.params.slug;

  const getIdCategory = " SELECT id_dm FROM sanpham WHERE slug = ?";
  db.query(getIdCategory, [slug], (err, result) => {
    if (err) return res.status(500).json({error:err.message});
    if (result.length === 0) return res.status(404).json({message: "Không tìm thấy sản phẩm"})


        const categoryId = result[0].id_dm;

  const getRelated = `SELECT * FROM sanpham WHERE id_dm = ? AND slug != ? AND an_hien = 1 LIMIT 8`;
  db.query(getRelated, [categoryId, slug], (err2, relatedProduct) => {
    if (err2) return res.status(500).json({error:err2.message});
    res.json(relatedProduct)
  }) 
  })
}
// Thêm sản phẩm
exports.createProduct = (req, res) => {
  const { ten, mo_ta, gia, gia_km, id_dm, hinh, an_hien, so_luong } = req.body;

  if (
    ten === undefined || mo_ta === undefined || gia === undefined ||
    gia_km === undefined || id_dm === undefined || so_luong === undefined ||
    hinh === undefined || an_hien === undefined
  ) {
    return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ thông tin sản phẩm!" });
  }

  const slug = ten.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-");

  const ngay = new Date();

  const sql = `
    INSERT INTO sanpham (ten, mo_ta, slug, ngay, gia, gia_km, id_dm, hinh, an_hien, so_luong)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [ten, mo_ta, slug, ngay, gia, gia_km, id_dm, hinh, an_hien, so_luong];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Lỗi khi chèn sản phẩm:", err);
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({
      message: "Thêm sản phẩm thành công!",
      insertedId: result.insertId,
    });
  });
};


// sửa sản phẩm
exports.updateProduct = (req, res) => {
  const { id_sp } = req.params;
  let {
    ten,
    slug,
    mo_ta,
    gia,
    gia_km,
    id_dm,
    hinh,
    an_hien,
    so_luong,
    ngay,
  } = req.body;

  an_hien = Number(an_hien) === 1 ? 1 : 0;

  const sql = `
    UPDATE sanpham 
    SET ten = ?, slug = ?, mo_ta = ?, gia = ?, gia_km = ?, id_dm = ?, hinh = ?, an_hien = ?, so_luong = ?, ngay = ?
    WHERE id_sp = ?
  `;

  db.query(
    sql,
    [ten, slug, mo_ta, gia, gia_km, id_dm, hinh, an_hien, so_luong, ngay, id_sp],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "không tìm thấy sản phẩm để cập nhật!" });
      }

      res.json({ message: "cập nhật sản phẩm thành công" });
    }
  );
};



// Xoá sản phẩm
exports.deleteProduct = (req, res) => {
  const { id_sp } = req.params;

  const sql = "UPDATE sanpham SET an_hien = 0 WHERE id_sp = ?";

  db.query(sql, [id_sp], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm để ẩn." });
    }

    res.json({ message: "Ẩn sản phẩm thành công!" });
  });
};

// tìm kiếm sp
exports.searchProducts = (req, res) => {
  const keyword = req.query.keyword;

  if (!keyword || keyword.trim() === "") {
    return res.status(400).json({ message: "Vui lòng nhập từ khóa tìm kiếm" });
  }

  const sql = "SELECT * FROM sanpham WHERE ten LIKE ? AND an_hien = 1";
  db.query(sql, [`%${keyword}%`], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

