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

router.post("/add-ulasan/:idBook/:statusCodeBorrow", async (req, res) => {
  const idBook = req.params.idBook;
  const dataUser = findUser(req.headers.authorization);
  const statusCodeBorrow = parseInt(req.params.statusCodeBorrow);
  const { pesan, rating } = req.body;
  console.log("halo");
  //   beri ulsan cuman 1 kali aja dalam satu akun
  await prisma.peminjaman
    .count({
      where: {
        idUser: dataUser.UserID,
        idBuku: idBook,
        status: statusCodeBorrow,
      },
    })
    .then(async (a) => {
      if (a > 0) {
        await prisma.ulasan_buku
          .count({
            where: {
              idUser: dataUser.UserID,
              idBuku: idBook,
              kodeAdmin: dataUser.kodeSekolah,
            },
          })
          .then((a) => {
            if (a < 1) {
              let data = {
                idUser: dataUser.UserID,
                idBuku: idBook,
                kodeAdmin: dataUser.kodeSekolah,
                pesan: pesan,
                rating: rating,
                dibuatPada: new Date().getTime(),
              };
              prisma.ulasan_buku.create({ data: data }).then((a) => {
                console.log(a);
                response(200, a, res, "ulasan berhasil ditambahkan");
              });
            } else {
              response(400, {}, res, "sudah pernah memberikan ulasan");
            }
          });
      } else {
        response(
          400,
          {},
          res,
          "belum tertacat id pinjam yang bisa melakukan ulasan"
        );
      }
    });
});

module.exports = router;
