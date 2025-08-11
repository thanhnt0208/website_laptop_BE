const express = require("express");
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require("../controllers/category.controller");

router.get("/", getCategories);
router.post("/", createCategory);
router.put("/:id_dm", updateCategory);
router.delete("/:id_dm", deleteCategory);

module.exports = router;