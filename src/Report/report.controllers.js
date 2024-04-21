const express = require("express");
const response = require("../../resTemp");
const prisma = require("../../db");
const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");
const { createObjectCsvWriter } = require("csv-writer");
const archiver = require("archiver");
const fs = require("fs");

const findCodeSchool = (tokenRequest) => {
  let token = tokenRequest;
  let splitToken = token.split(" ", 2);
  token = splitToken[1];
  const tokenFind = jwt.decode(token);
  return tokenFind;
};

const router = express.Router();

const findDataUser = (tokenRequest) => {
  let token = tokenRequest;
  let splitToken = token.split(" ", 2);
  token = splitToken[1];
  const tokenFind = jwt.decode(token);
  return tokenFind;
};

router.get("/in-mounth/:dateStart/:dateEnd", async (req, res) => {
  let dataUser = findDataUser(req.headers.authorization);
  let dateStart = req.params.dateStart;
  let dateEnd = req.params.dateEnd;
  let countAllBorrowBook = await prisma.peminjaman.count({
    where: {
      tanggalPengembalian: {
        gte: new Date(dateStart).getTime(),
        lt: new Date(dateEnd).getTime(),
      },
      kodeAdmin: dataUser.kodeSekolah,
      status: { in: [2, 3] },
    },
  });

  let dataBookReady = [];
  await prisma.peminjaman
    .findMany({
      where: {
        tanggalPengembalian: {
          gte: new Date(dateStart).getTime(),
          lt: new Date(dateEnd).getTime(),
        },
        kodeAdmin: dataUser.kodeSekolah,
        status: { in: [2, 3] },
      },
    })
    .then(async (a) => {
      for (let i = 0; i < a.length; i++) {
        let dataBook = await prisma.buku.findFirst({
          where: { BukuID: a[i].idBuku, kode_admin: dataUser.kodeSekolah },
        });
        let countBook = await prisma.peminjaman.count({
          where: {
            idBuku: dataBook.BukuID,
            kodeAdmin: dataBook.kodeSekolah,
            tanggalPengembalian: {
              gte: new Date(dateStart).getTime(),
              lt: new Date(dateEnd).getTime(),
            },
          },
        });
        let data = {
          BukuID: dataBook.BukuID,
          Gambar: dataBook.Gambar,
          Judul: dataBook.Judul,
          Penulis: dataBook.Penulis,
          Penerbit: dataBook.Penerbit,
          Sinopsis: dataBook.Sinopsis,
          TahunTerbit: dataBook.TahunTerbit,
          Jumlah: dataBook.Jumlah,
          kode_admin: dataBook.kode_admin,
          totalPinjam: countBook,
        };
        if (!dataBookReady.includes(data)) {
          dataBookReady.push(data);
        }
      }
    });

  let dataLate = [];
  await prisma.peminjaman
    .findMany({
      where: {
        tanggalPengembalian: {
          gte: new Date(dateStart).getTime(),
          lt: new Date(dateEnd).getTime(),
        },
        kodeAdmin: dataUser.kodeSekolah,
        terlambat: { gt: 0 },
      },
    })
    .then(async (a) => {
      // console.log("🚀 ~ .then ~ a:", a);
      for (let i = 0; i < a.length; i++) {
        let dataUser = await prisma.user.findFirst({
          where: { UserID: a[i].idUser },
        });
        let book = await prisma.buku.findFirst({
          select: { Judul: true },
          where: { BukuID: a[i].idBuku },
        });
        console.log("🚀 ~ .then ~ dataUser:", dataUser);
        let dataUserReady = {
          UserID: dataUser.UserID,
          Username: dataUser.Username,
          NoTelp: String(dataUser.NoTelp),
          Email: dataUser.Email,
          NamaLengkap: dataUser.NamaLengkap,
          Alamat: dataUser.Alamat,
          Sekolah: dataUser.Sekolah,
        };
        let dataReady = {
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
          denda: a[i].terlambat * 2000,
          dataUser: dataUserReady,
          book: book,
        };
        dataLate.push(dataReady);
      }
    });

  let dataBelumDikembalikan = [];
  await prisma.peminjaman
    .findMany({
      where: {
        tanggalPengembalian: {
          gte: new Date(dateStart).getTime(),
          lt: new Date(dateEnd).getTime(),
        },
        kodeAdmin: dataUser.kodeSekolah,
        status: 2,
      },
    })
    .then(async (a) => {
      console.log({ a });
      for (let i = 0; i < a.length; i++) {
        let dataUser = await prisma.user.findFirst({
          where: { UserID: a[i].idUser },
        });
        let book = await prisma.buku.findFirst({
          select: { Judul: true },
          where: { BukuID: a[i].idBuku },
        });
        console.log(dataUser);
        let dataUserReady = {
          UserID: dataUser.UserID,
          Username: dataUser.Username,
          Email: dataUser.Email,
          NamaLengkap: dataUser.NamaLengkap,
          Alamat: dataUser.Alamat,
          Sekolah: dataUser.Sekolah,
        };
        let dataReady = {
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
          buku: book,
          dataUser: dataUserReady,
        };

        dataBelumDikembalikan.push(dataReady);
      }
    });

  return response(
    200,
    {
      totalBukuDipinjam: countAllBorrowBook,
      detailJumlahBukuDipinjam: dataBookReady,
      dataTerlambatPengembalian: dataLate,
      dataBelumKembali: dataBelumDikembalikan,
    },
    res,
    "Berhasil Mendapatkan Data"
  );
  // console.log("🚀 ~ .then ~ dataLate:", dataLate);

  // // let lateBorrowBook = []
  // // await prisma.peminjaman.findMany({where:{}})
  // console.log("🚀 ~ router.get ~ identityBook:", dataBookReady);
  // console.log("🚀 ~ router.get ~ countAllBorrowBook:", countAllBorrowBook);
});

router.get("/list-data-report", async (req, res) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  let mounthNow = new Date().getMonth() + 1;
  console.log("🚀 ~ router.get ~ mounthNow:", mounthNow);
  let dataList = [];
  for (let i = 0; i < mounthNow; i++) {
    let data = {
      mounthYear: months[i] + " " + new Date().getFullYear(),
      dateStart: moment(
        new Date().getFullYear() + "-" + months[i] + "-" + 1
      ).format("YYYY-MM-DD"),
      dateEnd: moment(
        new Date().getFullYear() + "-" + months[i + 1] + "-" + 1
      ).format("YYYY-MM-DD"),
    };
    dataList.push(data);
  }
  response(200, dataList, res, "berhasil list");
});

const generateCsv1 = async (dataUserDetail, dateStart, dateEnd) => {
  const csvPath = createObjectCsvWriter({
    path: "./csvExport/dataTotalUser.csv",
    header: [
      {
        id: "total_buku",
        title: "total_buku",
      },
    ],
  });

  let dataUser = dataUserDetail;
  let countAllBorrowBook = await prisma.peminjaman.count({
    where: {
      tanggalPengembalian: { gte: new Date(dateStart), lt: new Date(dateEnd) },
      kodeAdmin: dataUser.kodeSekolah,
      status: { in: [2, 3] },
    },
  });

  const dataReady = [{ total_buku: countAllBorrowBook }];

  await csvPath.writeRecords(dataReady);
};

const generateCsv2 = async (dataUserDetail, dateStart, dateEnd) => {
  const csvPath = createObjectCsvWriter({
    path: "./csvExport/dataBukuPinjam.csv",
    header: [
      {
        id: "buku",
        title: "buku",
      },
      {
        id: "jumlah",
        title: "jumlah",
      },
    ],
  });

  let dataUser = dataUserDetail;
  let dataBookReady = [];
  await prisma.peminjaman
    .findMany({
      where: {
        tanggalPengembalian: {
          gte: new Date(dateStart),
          lt: new Date(dateEnd),
        },
        kodeAdmin: dataUser.kodeSekolah,
        status: { in: [2, 3] },
      },
    })
    .then(async (a) => {
      for (let i = 0; i < a.length; i++) {
        let dataBook = await prisma.buku.findFirst({
          where: { BukuID: a[i].idBuku, kode_admin: dataUser.kodeSekolah },
        });
        let countBook = await prisma.peminjaman.count({
          where: {
            idBuku: dataBook.BukuID,
            kodeAdmin: dataBook.kodeSekolah,
            tanggalPengembalian: {
              gte: new Date(dateStart),
              lt: new Date(dateEnd),
            },
          },
        });
        let data = {
          buku: dataBook.Judul,
          jumlah: countBook,
        };
        if (!dataBookReady.includes(data)) {
          dataBookReady.push(data);
        }
      }
    });

  let dataReady = [];
  dataReady = dataReady.concat(dataBookReady);

  await csvPath.writeRecords(dataReady);
};

const generateCsv3 = async (dataUserDetail, dateStart, dateEnd) => {
  const csvPath = createObjectCsvWriter({
    path: "./csvExport/dataTerlambat.csv",
    header: [
      {
        id: "buku",
        title: "buku",
      },
      {
        id: "nama_pengguna",
        title: "nama_pengguna",
      },
      {
        id: "jumlah",
        title: "jumlah",
      },
      {
        id: "terlambat",
        title: "terlambat",
      },
      {
        id: "denda",
        title: "denda",
      },
    ],
  });

  let dataUser = dataUserDetail;
  let dataLate = [];
  await prisma.peminjaman
    .findMany({
      where: {
        tanggalPengembalian: {
          gte: new Date(dateStart),
          lt: new Date(dateEnd),
        },
        kodeAdmin: dataUser.kodeSekolah,
        terlambat: { gt: 0 },
      },
    })
    .then(async (a) => {
      // console.log("🚀 ~ .then ~ a:", a);
      for (let i = 0; i < a.length; i++) {
        let dataUser = await prisma.user.findFirst({
          where: { UserID: a[i].idUser },
        });
        let book = await prisma.buku.findFirst({
          select: { Judul: true },
          where: { BukuID: a[i].idBuku },
        });
        console.log("🚀 ~ .then ~ dataUser:", dataUser);
        let dataUserReady = {
          UserID: dataUser.UserID,
          Username: dataUser.Username,
          NoTelp: String(dataUser.NoTelp),
          Email: dataUser.Email,
          NamaLengkap: dataUser.NamaLengkap,
          Alamat: dataUser.Alamat,
          Sekolah: dataUser.Sekolah,
        };
        let dataReady = {
          buku: book.Judul,
          nama_pengguna: dataUserReady.NamaLengkap,
          jumlah: a[i].jumlah,
          terlambat: a[i].terlambat,
          denda: a[i].terlambat * 2000,
        };
        dataLate.push(dataReady);
      }
    });

  let dataReady = [];
  dataReady = dataReady.concat(dataLate);

  await csvPath.writeRecords(dataReady);
};

const generateCsv4 = async (dataUserDetail, dateStart, dateEnd) => {
  const csvPath = createObjectCsvWriter({
    path: "./csvExport/dataBelumKembali.csv",
    header: [
      {
        id: "buku",
        title: "buku",
      },
      {
        id: "nama_pengguna",
        title: "nama_pengguna",
      },
      {
        id: "jumlah",
        title: "jumlah",
      },
    ],
  });

  let dataUser = dataUserDetail;
  let dataBelumDikembalikan = [];
  await prisma.peminjaman
    .findMany({
      where: {
        tanggalPengembalian: {
          gte: new Date(dateStart),
          lt: new Date(dateEnd),
        },
        kodeAdmin: dataUser.kodeSekolah,
        status: 2,
      },
    })
    .then(async (a) => {
      console.log({ a });
      for (let i = 0; i < a.length; i++) {
        let dataUser = await prisma.user.findFirst({
          where: { UserID: a[i].idUser },
        });
        let book = await prisma.buku.findFirst({
          select: { Judul: true },
          where: { BukuID: a[i].idBuku },
        });
        console.log(dataUser);
        let dataUserReady = {
          UserID: dataUser.UserID,
          Username: dataUser.Username,
          Email: dataUser.Email,
          NamaLengkap: dataUser.NamaLengkap,
          Alamat: dataUser.Alamat,
          Sekolah: dataUser.Sekolah,
        };
        let dataReady = {
          buku: book.Judul,
          nama_pengguna: dataUserReady.NamaLengkap,
          jumlah: a[i].jumlah,
        };

        dataBelumDikembalikan.push(dataReady);
      }
    });

  let dataReady = [];
  dataReady = dataReady.concat(dataBelumDikembalikan);

  await csvPath.writeRecords(dataReady);
};

router.get("/download-csv/:dateStart/:dateEnd", async (req, res) => {
  let dataUserDetail = findDataUser(req.headers.authorization);
  await generateCsv1(dataUserDetail, req.params.dateStart, req.params.dateEnd);
  await generateCsv2(dataUserDetail, req.params.dateStart, req.params.dateEnd);
  await generateCsv3(dataUserDetail, req.params.dateStart, req.params.dateEnd);
  await generateCsv4(dataUserDetail, req.params.dateStart, req.params.dateEnd);

  const fileBody = fs.createWriteStream("./csvExport/file.zip");
  const archive = archiver("zip", { zlib: { level: 9 } });

  fileBody.on("close", () => {
    console.log(archive.pointer() + " byte");
  });

  archive.file("./csvExport/dataTotalUser.csv", { name: "dataTotalUser.csv" });
  archive.file("./csvExport/dataBukuPinjam.csv", {
    name: "dataBukuPinjam.csv",
  });
  archive.file("./csvExport/dataTerlambat.csv", { name: "dataTerlambat.csv" });
  archive.file("./csvExport/dataBelumKembali.csv", {
    name: "dataBelumKembali.csv",
  });

  res.setHeader("Content-Disposition", `attachment; filename="file.zip"`);
  res.setHeader("Content-Type", "application/zip");

  archive.pipe(fileBody);
  archive.pipe(res);

  archive.finalize();

  // const fileCsv = "/csvExport/file.zip";
  // try {
  //   response(200, fileCsv, res, "file didapat");
  // } catch (err) {
  //   console.log("🚀 ~ router.get ~ err:", err);
  // }
});

module.exports = router;
