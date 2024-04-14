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
      .then(async (a) => {
        console.log(a);
        let dataBook = [];
        for (let i = 0; i < a.length; i++) {
          const dataBukuKategori = await prisma.kategori_buku_relasi.findMany({
            where: { idBuku: a[i].BukuID },
          });
          const borrowIsBook = await prisma.peminjaman.count({
            where: {
              idBuku: a[i].BukuID,
              status: 2,
              kodeAdmin: a[i].kode_admin,
            },
          });
          if (dataBukuKategori.length > 0) {
            let data = [
              {
                BukuID: a[i].BukuID,
                Gambar: a[i].Gambar,
                Judul: a[i].Judul,
                Penulis: a[i].Penulis,
                Penerbit: a[i].Penerbit,
                Sinopsis: a[i].Penerbit,
                TahunTerbit: a[i].TahunTerbit,
                Jumlah: a[i].Jumlah,
                kode_admin: a[i].kode_admin,
                kategori: dataBukuKategori,
                bukuSedangDipinjam: borrowIsBook,
              },
            ];
            dataBook = dataBook.concat(data);
          } else {
            let data = [
              {
                BukuID: a[i].BukuID,
                Gambar: a[i].Gambar,
                Judul: a[i].Judul,
                Penulis: a[i].Penulis,
                Penerbit: a[i].Penerbit,
                Sinopsis: a[i].Penerbit,
                TahunTerbit: a[i].TahunTerbit,
                Jumlah: a[i].Jumlah,
                kode_admin: a[i].kode_admin,
                kategori: [],
                bukuSedangDipinjam: borrowIsBook,
              },
            ];
            dataBook = dataBook.concat(data);
          }
        }

        return response(
          200,
          { count: a.length, daftarBuku: dataBook },
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

router.get("/borrow/:statusCode", async (req, res) => {
  if (!req.headers.authorization) {
    response(401, {}, res, "diperlukan auth");
  } else {
    const dataUser = findDataUser(req.headers.authorization);
    let skipData = parseInt(req.query.skip);
    let takeData = parseInt(req.query.take);

    let dataReady = [];
    await prisma.peminjaman
      .findMany({
        take: takeData,
        skip: skipData,
        where: {
          kodeAdmin: dataUser.kodeSekolah,
          status: parseInt(req.params.statusCode),
        },
      })
      .then(async (a) => {
        for (let i = 0; i < a.length; i++) {
          let buku = await prisma.buku.findMany({
            select: { Judul: true },
            where: { BukuID: a[i].idBuku },
          });

          let user = await prisma.user.findFirst({
            select: { Username: true, NoTelp: true },
            where: { UserID: a[i].idUser },
          });
          let data = {
            dataPinjam: a[i],
            buku: buku,
            user: {
              Username: user.Username,
              NoTelp: String(user.NoTelp),
            },
          };
          console.log("🚀 ~ .then ~ data:", data);

          dataReady.push(data);
        }
        response(
          200,
          { count: a.length, daftarPinjam: dataReady },
          res,
          a.length == 0
            ? "belum ada yang melukan peminjaman"
            : "berhasil mengambil data"
        );
      });
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
        // console.log({ a: a.length });
        for (let i = 0; i < a.length; i++) {
          sumRating += a[i].rating;
          // console.log({ sumRating });
          sumAkun += i + 1;
          // console.log({ sumAkun });
          let dataUser = await prisma.user.findMany({
            where: { UserID: a[i].idUser },
          });
          // console.log(dataUser);
          let data = [
            {
              username: dataUser[0].Username,
              pesan: a[i].pesan,
              rating: a[i].rating,
              imageProfil: dataUser[0].ProfilAkun,
            },
          ];
          dataUlasan = dataUlasan.concat(data);
          // console.log(data);
        }
        // console.log(dataUlasan);
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

router.get("/dashboard", async (req, res) => {
  const dataUser = findDataUser(req.headers.authorization);
  // console.log(dataUser);

  if (dataUser.Tipe === "USER") {
    let collection = [];
    let book = [];
    let pjmBook = [];

    // peminjaman
    await prisma.peminjaman
      .findMany({
        where: {
          idUser: dataUser.UserID,
          kodeAdmin: dataUser.kodeSekolah,
          status: 2,
        },
      })
      .then(async (a) => {
        if (a.length > 0) {
          for (let i = 0; i < a.length; i++) {
            let data = {
              idPeminjaman: a[i].idPeminjaman,
              tanggalPeminjaman: a[i].tanggalPeminjaman,
              tanggalPengembalian: a[i].tanggalPengembalian,
              status: await prisma.status_peminjaman.findMany({
                select: { status: true },
                where: { id: a[i].status },
              }),
              jumlah: a[i].jumlah,
              buku: await prisma.buku.findMany({
                where: {
                  BukuID: a[i].idBuku,
                  kode_admin: dataUser.kodeSekolah,
                },
              }),
            };
            pjmBook = pjmBook.concat(data);
          }
        } else {
          pjmBook = [];
        }
      });

    // koleksi
    await prisma.$queryRaw`SELECT * FROM koleksi_pribadi WHERE kodeAdmin=${dataUser.kodeSekolah} && idUser=${dataUser.UserID}  ORDER BY RAND() LIMIT 3`.then(
      async (a) => {
        // console.log(a.length);
        for (let i = 0; i < a.length; i++) {
          let data = await prisma.buku.findMany({
            where: { BukuID: a[i].idBuku, kode_admin: dataUser.kodeSekolah },
          });

          collection = collection.concat(data);
        }
      }
    );

    // buku
    await prisma.$queryRaw`SELECT * FROM buku WHERE kode_admin=${dataUser.kodeSekolah}  ORDER BY RAND() LIMIT 20`.then(
      (a) => {
        for (let i = 0; i < a.length; i++) {
          book = book.concat(a[i]);
        }
      }
    );

    let noTelpAdmin = [];
    await prisma.user
      .findMany({
        select: { NoTelp: true },
        where: { Sekolah: dataUser.Sekolah, Tipe: "ADMIN" },
      })
      .then((a) => {
        for (let i = 0; i < a.length; i++) {
          let noTelp = a[i].NoTelp;
          let noTelpConvert = `62${noTelp.toString()}`;
          noTelpAdmin = noTelpAdmin.concat(noTelpConvert);
        }
      });

    let noTelpEmployee = [];
    await prisma.user
      .findMany({
        select: { NoTelp: true },
        where: { Sekolah: dataUser.Sekolah, Tipe: "EMPLOYEE" },
      })
      .then((a) => {
        for (let i = 0; i < a.length; i++) {
          let noTelp = a[i].NoTelp;
          let noTelpConvert = `62${noTelp.toString()}`;
          noTelpEmployee = noTelpEmployee.concat(noTelpConvert);
        }
      });
    let dataDashboard = {
      user: dataUser,
      peminjaman: pjmBook,
      koleksiBuku: collection,
      noTelponAdmin: noTelpAdmin,
      noTelpEmployee: noTelpEmployee,
      buku: book,
    };
    response(200, dataDashboard, res, "berhasil mendapatkan data");
  } else if (dataUser.Tipe != "USER") {
    let totalAkunUser = 0;
    let totalAkunPetugas = 0;
    let totalBukuDipinjam = 0;
    let mostBookBorrow = [];

    await prisma.user
      .count({ where: { Sekolah: dataUser.Sekolah, Tipe: "USER" } })
      .then((a) => {
        totalAkunUser += a;
      });

    await prisma.user
      .count({ where: { Sekolah: dataUser.Sekolah, Tipe: "EMPLOYEE" } })
      .then((a) => {
        totalAkunPetugas += a;
      });

    await prisma.peminjaman
      .count({
        where: { kodeAdmin: dataUser.kodeAdmin, status: 2 },
      })
      .then((a) => {
        totalBukuDipinjam += a;
      });

    // buku populer
    await prisma.$queryRaw`SELECT idBuku,SUM(jumlah) AS totalPinjam FROM peminjaman WHERE status=2 OR status=3 GROUP BY idBuku ORDER BY totalPinjam DESC LIMIT 5;`.then(
      async (a) => {
        console.log(a);
        for (let i = 0; i < a.length; i++) {
          await prisma.buku
            .findFirst({
              where: { BukuID: a[i].idBuku, kode_admin: dataUser.kodeSekolah },
            })
            .then((b) => {
              let data = [
                {
                  buku: b,
                  jumlahPinjam: parseInt(a[i].totalPinjam),
                },
              ];
              mostBookBorrow = mostBookBorrow.concat(data);
            });
        }
      }
    );

    let dataDashboard = {
      user: dataUser,
      ProfilAkun: dataUser.ProfilAkun,
      TotalAkunUser: totalAkunUser,
      TotalAkunPetugas: totalAkunPetugas,
      TotalBukuMasihDipinjam: totalBukuDipinjam,
      BukuPopuler: mostBookBorrow,
    };

    response(200, dataDashboard, res, "berhasil mendapatkan data");
  }
});

router.get("/account", async (req, res) => {
  const dataUser = findDataUser(req.headers.authorization);

  await prisma.user
    .findFirst({ where: { UserID: dataUser.UserID } })
    .then((a) => {
      console.log(a);
      response(
        200,
        {
          UserID: a.UserID,
          Username: a.Username,
          NoTelp: String(a.NoTelp),
          Email: a.Email,
          NamaLengkap: a.NamaLengkap,
          Alamat: a.Alamat,
          Sekolah: a.Sekolah,
          Tipe: a.Tipe,
          ProfilAkun: a.ProfilAkun,
        },
        res,
        "Berhasil Mendapat Data"
      );
    });
});

router.get("/collections", async (req, res) => {
  const dataUser = findDataUser(req.headers.authorization);
  const take = parseInt(req.query.take);
  const skip = parseInt(req.query.skip);

  await prisma.koleksi_pribadi
    .findMany({
      where: { idUser: dataUser.UserID, kodeAdmin: dataUser.kodeSekolah },
      take: take,
      skip: skip,
    })
    .then(async (a) => {
      let data = [];
      for (let i = 0; i < a.length; i++) {
        let dataBuku = await prisma.buku.findFirst({
          where: { BukuID: a[i].idBuku, kode_admin: a[i].kodeAdmin },
        });
        data.push(dataBuku);
      }
      return response(200, data, res, "Berhasil Mengambil Koleksi");
    });
});

router.get("/employee", async (req, res) => {
  const dataUser = findDataUser(req.headers.authorization);

  await prisma.user
    .findMany({ where: { Sekolah: dataUser.Sekolah, Tipe: "EMPLOYEE" } })
    .then((a) => {
      let listData = [];
      for (let i = 0; i < a.length; i++) {
        let data = {
          UserID: a[i].UserID,
          Username: a[i].Username,
          Password: a[i].Password,
          NoTelp: String(a[i].NoTelp),
          Email: a[i].Email,
          NamaLengkap: a[i].NamaLengkap,
          Alamat: a[i].Alamat,
          Sekolah: a[i].Sekolah,
          Tipe: a[i].Tipe,
          ProfilAkun: a[i].ProfilAkun,
        };
        listData.push(data);
      }
      return response(200, listData, res, "Berhasil Mendapatkan Data");
    });
});

module.exports = router;
