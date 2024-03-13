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
    if (dataUser.Tipe === "USER") {
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
    } else {
      let skipData = parseInt(req.query.skip);
      let takeData = parseInt(req.query.take);

      await prisma.peminjaman
        .findMany({
          take: takeData,
          skip: skipData,
          where: { kodeAdmin: dataUser.kodeSekolah },
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
  }
});

router.get("/ulasan/:idBook", async (req, res) => {
  const idBook = req.params.idBook;
  if (req.headers.authorization) {
    const dataUser = findDataUser(req.headers.authorization);
    const takeData = parseInt(req.query.take);
    const skipData = parseInt(req.query.skip);

    await prisma.ulasan_buku
      .findMany({
        take: takeData,
        skip: skipData,
        where: { idBuku: idBook, kodeAdmin: dataUser.kodeSekolah },
      })
      .then(async (a) => {
        // console.log(a);
        let sumRating = 0;
        let sumAkun = 0;
        let dataUlasan = [];
        console.log({ a: a.length });
        for (let i = 0; i < a.length; i++) {
          sumRating += a[i].rating;
          console.log({ sumRating });
          sumAkun += i + 1;
          console.log({ sumAkun });
          let dataUser = await prisma.user.findMany({
            where: { UserID: a[i].idUser },
          });
          console.log(dataUser);
          let data = [
            {
              username: dataUser[0].Username,
              pesan: a[i].pesan,
              rating: a[i].rating,
              imageProfil: dataUser[0].ProfilAkun,
            },
          ];
          dataUlasan = dataUlasan.concat(data);
          console.log(data);
        }
        console.log(dataUlasan);
        // console.log({ sumRating, sumAkun });
        let avgRating = Math.floor(sumRating / dataUlasan.length);

        response(
          200,
          { avgRating: avgRating, ulasan: dataUlasan },
          res,
          "berhasil mendapatkan data ulasan"
        );
        // console.log(avgRating);
      });
  } else {
    response(401, {}, res, "token diperlukan / token tidak valid");
  }
});

module.exports = router;
