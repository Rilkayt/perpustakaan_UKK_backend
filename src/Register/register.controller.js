const express = require("express");
const response = require("../../resTemp");
const prisma = require("../../db");

const router = express.Router();

router.post("/", async (req, res) => {
  const inputRegister = req.body;

  if ((inputRegister.tipe = "ADMIN")) {
    let checkCode =
      await prisma.$queryRaw`SELECT * FROM kode_admin WHERE Kode = ${inputRegister}`;

    if (checkCode.length > 0) {
    }
  }
});

module.exports = router;
