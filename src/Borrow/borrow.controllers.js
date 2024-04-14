const express = require("express");
const response = require("../../resTemp");
const prisma = require("../../db");
const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");

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

  console.log(moment(new Date()).tz("Asia/Jakarta").format("YYYY-MM-DD"));
  const stokBook = await prisma.buku.findMany({ where: { BukuID: idBook } });
  console.log(stokBook);
  if (stokBook[0].Jumlah > 0) {
    let idPinjam = createIdPeminjaman(
      dataUser,
      tanggal_peminjaman,
      tanggal_pengembalian
    );

    const tglPinjam = new Date(tanggal_peminjaman);
    const tglKembali = new Date(tanggal_pengembalian);
    // console.log({ tglPinjam });

    //   console.log(dataUser);
    try {
      await prisma.peminjaman
        .create({
          data: {
            idPeminjaman: idPinjam,
            idUser: dataUser.UserID,
            idBuku: idBook,
            tanggalPeminjaman: tglPinjam,
            tanggalPengembalian: tglKembali,
            status: 1,
            jumlah: jumlah,
            kodeAdmin: dataUser.kodeSekolah,
            dibuatPada: new Date(moment(new Date()).tz("Asia/Jakarta")),
            telahKembali: "",
            terlambat: 0,
          },
        })
        .then((a) => {
          response(200, a, res, "berhasil melakukan peminjaman");
        });
    } catch (error) {
      console.log(error);
    }
  } else {
    response(500, {}, res, "stok buku sedang habis");
  }
});

router.put("/change-status/:idPeminjaman/:kodeStatus", async (req, res) => {
  const idPinjam = req.params.idPeminjaman;
  const kodeStatus = parseInt(req.params.kodeStatus);

  const ValidateID = await prisma.peminjaman.count({
    where: { idPeminjaman: idPinjam },
  });

  if (ValidateID > 0) {
    await prisma.peminjaman
      .update({
        where: { idPeminjaman: idPinjam },
        data: { status: kodeStatus },
      })
      .then(async (a) => {
        let dataPinjamBuku = await prisma.peminjaman.findMany({
          where: { idPeminjaman: idPinjam },
        });
        const jumlahBukuAwal = await prisma.buku.findMany({
          where: { BukuID: dataPinjamBuku[0].idBuku },
        });
        if (dataPinjamBuku[0].status === 2) {
          let jumlahBukuSekarang =
            jumlahBukuAwal[0].Jumlah - dataPinjamBuku[0].jumlah;
          await prisma.buku.update({
            where: { BukuID: dataPinjamBuku[0].idBuku },
            data: { Jumlah: jumlahBukuSekarang },
          });
        } else if (dataPinjamBuku[0].status === 3) {
          let jumlahBukuSekarang =
            jumlahBukuAwal[0].Jumlah + dataPinjamBuku[0].jumlah;
          await prisma.buku.update({
            where: { BukuID: dataPinjamBuku[0].idBuku },
            data: { Jumlah: jumlahBukuSekarang },
          });
          await prisma.peminjaman
            .update({
              where: { idPeminjaman: idPinjam },
              data: {
                telahKembali: moment(new Date())
                  .tz("Asia/Jakarta")
                  .format("YYYY-MM-DD"),
              },
            })
            .then(async (a) => {
              let dateRange =
                new Date(a.telahKembali).getDay() -
                new Date(a.tanggalPengembalian).getDay();
              console.log(
                "🚀 ~ awaitprisma.peminjaman.update ~ dateRange:",
                dateRange
              );
              if (dateRange >= 1) {
                await prisma.peminjaman.update({
                  where: { idPeminjaman: idPinjam },
                  data: { terlambat: dateRange },
                });
              }
            });
        }
        console.log(dataPinjamBuku);
        response(200, a, res, "berhasil mengubah status");
      });
  }
});

router.get("/user-list", async (req, res) => {
  let dataUser = findCodeSchool(req.headers.authorization);
  console.log("🚀 ~ router.get ~ dataUser:", dataUser);

  const take = req.query.take;
  const skip = req.query.skip;

  let getData = [];
  await prisma.peminjaman
    .findMany({
      where: { idUser: dataUser.UserID },
      orderBy: { dibuatPada: "desc" },
      take: parseInt(take),
      skip: parseInt(skip),
    })
    .then(async (a) => {
      for (let i = 0; i < a.length; i++) {
        let data = await prisma.buku.findFirst({
          select: { Judul: true, Gambar: true },
          where: { BukuID: a[i].idBuku },
        });
        let dataReady = {
          dataPinjam: a[i],
          dataBook: data,
        };
        getData.push(dataReady);
      }
      return response(200, getData, res, "Berhasil Mendapatkan Data");
    });
});

module.exports = router;
