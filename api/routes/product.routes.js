const express = require("express");
const router = express.Router();
const { getProducts, getProductByIdCategory, getProductBySlug, getProductRelated,createProduct, updateProduct, deleteProduct, searchProducts} = require("../controllers/product.controller");

router.get("/", getProducts);
router.get("/loai/:id_loai", getProductByIdCategory); 
router.get("/search", searchProducts);
router.get("/related/:slug", getProductRelated);     
router.get("/:slug", getProductBySlug);               
router.post("/", createProduct);
router.put("/:id_sp", updateProduct);
router.delete("/:id_sp", deleteProduct);



module.exports = router;
