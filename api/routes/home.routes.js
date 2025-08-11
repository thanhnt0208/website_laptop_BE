const express = require("express");
const router = express.Router();
const { getHomeProducts } = require("../controllers/home.controller");

router.get("/", getHomeProducts);

module.exports = router;
