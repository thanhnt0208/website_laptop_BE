const express = require("express");
const router = express.Router();
const {getProductById, getProducts, getProductByIdCategory, getProductBySlug, getProductRelated, increaseBuy,
    createProduct, updateProduct, deleteProduct, searchProducts, toggleProductVisibility, increaseView, getVisibleProducts} 
    = require("../controllers/product.controller");

router.get("/", getProducts);
router.get("/admin/products", getVisibleProducts);
router.get("/loai/:id_loai", getProductByIdCategory); 
router.get("/search", searchProducts);
router.get("/related/:slug", getProductRelated);     

router.get("/slug/:slug", getProductBySlug); 
router.get("/:id_sp", getProductById);
   
router.post("/", createProduct);
router.put("/:id_sp", updateProduct);
router.delete("/:id_sp", deleteProduct);
router.put("/:id_sp/toggle", toggleProductVisibility)
router.post("/:id_sp/view", increaseView);
router.post("/:id_sp/buy", increaseBuy);

module.exports = router;
