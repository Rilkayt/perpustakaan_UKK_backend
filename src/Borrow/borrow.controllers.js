const express = require("express");
const response = require("../../resTemp");
const prisma = require("../../db");
const jwt = require("jsonwebtoken");

const findCodeSchool = (tokenRequest) => {
  let token = tokenRequest;
  let splitToken = token.split(" ", 2);
  token = splitToken[1];
  const tokenFind = jwt.decode(token);
  return tokenFind;
};

const createIdPeminjaman = (
  dataUser,
  tanggalPeminjaman,
  tanggalPengembalian
) => {
  const tglPinjam = new Date(tanggalPeminjaman).getDate();
  const tglKembali = new Date(tanggalPengembalian).getDate();
  const randomNumber1 = Math.floor(1000 + Math.random() * 9000);
  const randomNumber2 = Math.floor(1000 + Math.random() * 9000);
  let idFix = `PJM${tglPinjam}${tglKembali}${randomNumber1}DGNKD${randomNumber2}`;
  //   console.log(idFix);
  return idFix;
};

const router = express.Router();

router.post("/:idBook", async (req, res) => {
  const idBook = req.params.idBook;
  const { tanggal_peminjaman, tanggal_pengembalian, jumlah } = req.body;
  let dataUser = findCodeSchool(req.headers.authorization);

  let idPinjam = createIdPeminjaman(
    dataUser,
    tanggal_peminjaman,
    tanggal_pengembalian
  );

  const tglPinjam = new Date(tanggal_peminjaman);
  const tglKembali = new Date(tanggal_pengembalian);
  console.log({ tglPinjam });

  const data = {
    idPeminjaman: idPinjam,
    idUser: dataUser.UserID,
    idBuku: idBook,
    tanggalPeminjaman: tglPinjam,
    tanggalPengembalian: tglKembali,
    status: 1,
    jumlah: jumlah,
  };
  //   console.log(dataUser);
  await prisma.peminjaman
    .create({
      data: data,
    })
    .then((a) => {
      response(200, a, res, "berhasil melakukan peminjaman");
    });
});

module.exports = router;
