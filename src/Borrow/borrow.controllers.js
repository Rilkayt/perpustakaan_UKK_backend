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

    const tglPinjam = new Date(tanggal_peminjaman).getTime();
    const tglKembali = new Date(tanggal_pengembalian).getTime();
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
            dibuatPada: new Date().getTime(),
            telahKembali: 0,
            terlambat: 0,
          },
        })
        .then((a) => {
          console.log(a);
          let data = {
            idPeminjaman: a.idPeminjaman,
            tanggalPeminjaman: String(a.tanggalPeminjaman),
            tanggalPengembalian: String(a.tanggalPengembalian),
            jumlah: a.jumlah,
            dibuatPada: String(a.dibuatPada),
            idUser: a.idUser,
            idBuku: a.idBuku,
            kodeAdmin: a.kodeAdmin,
            status: a.status,
            telahKembali: String(a.telahKembali),
            terlambat: a.terlambat,
          };
          response(200, data, res, "berhasil melakukan peminjaman");
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
                telahKembali: Date.now(),
              },
            })
            .then(async (a) => {
              console.log(a);
              console.log(new Date(parseInt(a.telahKembali)).getTime());
              console.log(new Date(parseInt(a.tanggalPengembalian)).getTime());
              let dateRange =
                new Date(parseInt(a.telahKembali)).getTime() -
                new Date(parseInt(a.tanggalPengembalian)).getTime();
              console.log(
                "🚀 ~ awaitprisma.peminjaman.update ~ dateRange:",
                new Date(dateRange).getDate()
              );
              dateRange = Math.floor(dateRange / (1000 * 60 * 60 * 24));
              if (dateRange > 0) {
                await prisma.peminjaman.update({
                  where: { idPeminjaman: idPinjam },
                  data: { terlambat: new Date(dateRange).getDate() },
                });
              } else {
                await prisma.peminjaman.update({
                  where: { idPeminjaman: idPinjam },
                  data: { terlambat: 0 },
                });
              }
            });
          console.log(
            "🚀 ~ .then ~ new Date(parseInt(a.telahKembali)).getDay():",
            new Date(parseInt(a.telahKembali)).getDay()
          );
          console.log(
            "🚀 ~ .then ~ new Date(parseInt(a.telahKembali)).getDay():",
            new Date(parseInt(a.telahKembali)).getDay()
          );
          console.log(
            "🚀 ~ .then ~ new Date(parseInt(a.telahKembali)).getDay():",
            new Date(parseInt(a.telahKembali)).getDay()
          );
          console.log(
            "🚀 ~ .then ~ new Date(parseInt(a.telahKembali)).getDay():",
            new Date(parseInt(a.telahKembali)).getDay()
          );
        }
        console.log(dataPinjamBuku);
        let data = {
          idPeminjaman: a.idPeminjaman,
          tanggalPeminjaman: String(a.tanggalPeminjaman),
          tanggalPengembalian: String(a.tanggalPengembalian),
          jumlah: a.jumlah,
          dibuatPada: String(a.dibuatPada),
          idUser: a.idUser,
          idBuku: a.idBuku,
          kodeAdmin: a.kodeAdmin,
          status: a.status,
          telahKembali: String(a.telahKembali),
          terlambat: a.terlambat,
        };
        response(200, data, res, "berhasil mengubah status");
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
          dataPinjam: {
            idPeminjaman: a[i].idPeminjaman,
            tanggalPeminjaman: String(a[i].tanggalPeminjaman),
            tanggalPengembalian: String(a[i].tanggalPengembalian),
            jumlah: a[i].jumlah,
            dibuatPada: String(a[i].dibuatPada),
            idUser: a[i].idUser,
            idBuku: a[i].idBuku,
            kodeAdmin: a[i].kodeAdmin,
            status: a[i].status,
            telahKembali: String(a[i].telahKembali),
            terlambat: a[i].terlambat,
          },
          dataBook: data,
        };
        getData.push(dataReady);
      }
      return response(200, getData, res, "Berhasil Mendapatkan Data");
    });
});

module.exports = router;
