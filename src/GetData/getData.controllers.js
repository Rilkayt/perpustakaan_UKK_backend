const express = require("express");
const response = require("../../resTemp");
const prisma = require("../../db");
const jwt = require("jsonwebtoken");

const findDataUser = (tokenRequest) => {
  let token = tokenRequest;
  let splitToken = token.split(" ", 2);
  token = splitToken[1];
  const tokenFind = jwt.decode(token);
  // console.log(tokenFind);
  return tokenFind;
};

const router = express.Router();

router.get("/books", async (req, res) => {
  if (!req.headers.authorization) {
    response(401, {}, res, "diperlukan auth");
  } else {
    const dataUser = findDataUser(req.headers.authorization);
    let skipData = parseInt(req.query.skip);
    let takeData = parseInt(req.query.take);
    await prisma.buku
      .findMany({
        take: takeData,
        skip: skipData,
        where: { kode_admin: dataUser.kodeSekolah },
      })
      .then((a) => {
        response(
          200,
          { count: a.length, daftarBuku: a },
          res,
          a.length == 0
            ? "buku sudah tidak tersedia / sudah max"
            : "berhasil mengambil data"
        );
      });
  }
});

router.get("/borrow", async (req, res) => {
  if (!req.headers.authorization) {
    response(401, {}, res, "diperlukan auth");
  } else {
    const dataUser = findDataUser(req.headers.authorization);
    let skipData = parseInt(req.query.skip);
    let takeData = parseInt(req.query.take);

    await prisma.peminjaman
      .findMany({
        take: takeData,
        skip: skipData,
        where: { idUser: dataUser.UserID, kodeAdmin: dataUser.kodeSekolah },
      })
      .then((a) => {
        response(
          200,
          { count: a.length, daftarBuku: a },
          res,
          a.length == 0
            ? "belum pernah melakukan peminjaman"
            : "berhasil mengambil data"
        );
      });
  }
});

module.exports = router;
