const express = require("express");
const response = require("../../resTemp");
const prisma = require("../../db");
const jwt = require("jsonwebtoken");

const findUser = (tokenRequest) => {
  let token = tokenRequest;
  let splitToken = token.split(" ", 2);
  token = splitToken[1];
  const tokenFind = jwt.decode(token);
  console.log(tokenFind);
  return tokenFind;
};

const router = express.Router();

router.post("/add-collection/:idBook", async (req, res) => {
  const idBook = req.params.idBook;
  const dataUser = findUser(req.headers.authorization);

  await prisma.buku.count({ where: { BukuID: idBook } }).then(async (a) => {
    if (a < 1) {
      response(400, a, res, "buku tidak ditemukan");
      return;
    } else {
      await prisma.koleksi_pribadi
        .count({
          where: {
            idBuku: idBook,
            idUser: dataUser.UserID,
            kodeAdmin: dataUser.kodeSekolah,
          },
        })
        .then((a) => {
          a > 0 ? response(400, a, res, "sudah tersedia di koleksi") : null;
        });
      const data = {
        idUser: dataUser.UserID,
        idBuku: idBook,
        kodeAdmin: dataUser.kodeSekolah,
      };

      await prisma.koleksi_pribadi.create({ data: data }).then((a) => {
        response(200, a, res, "buku berhasil ditambhakan ke koleksi");
      });
    }
  });
});

router.delete("/delete-collection/:idBook", async (req, res) => {
  const idBook = req.params.idBook;
  const dataUser = findUser(req.headers.authorization);

  await prisma.koleksi_pribadi
    .deleteMany({
      where: {
        idBuku: idBook,
        idUser: dataUser.UserID,
        kodeAdmin: dataUser.kodeSekolah,
      },
    })
    .then((a) => {
      response(200, a, res, "berhasil menghapus buku dari koleksi");
    });
});

module.exports = router;
