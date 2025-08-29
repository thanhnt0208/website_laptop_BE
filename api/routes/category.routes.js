const express = require("express");
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory, toggleCategory } = require("../controllers/category.controller");

router.get("/", getCategories);
router.post("/", createCategory);
router.put("/:id_dm", updateCategory);
router.delete("/:id_dm", deleteCategory);
router.put("/toggle/:id_dm", toggleCategory);

module.exports = router;