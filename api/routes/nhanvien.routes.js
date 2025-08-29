const express = require("express");
const router = express.Router();
const nhanvienController = require("../controllers/nhanvien.controller");

router.get("/", nhanvienController.getAllNhanVien);
router.post("/", nhanvienController.createNhanVien);
router.put("/:id", nhanvienController.updateNhanVien);
router.put("/toggle/:id", nhanvienController.toggleNhanVien);

module.exports = router;
