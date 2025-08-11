const express = require('express');
const router = express.Router();
const { getnguoidungById, updatenguoidung, doimatkhau} = require('../controllers/nguoidung.controller');


// GET người dùng theo ID
router.get('/:id_kh',getnguoidungById);

// PUT cập nhật người dùng
router.put('/:id_kh', updatenguoidung);
router.put('/:id_kh/doimatkhau', doimatkhau);

module.exports = router;
