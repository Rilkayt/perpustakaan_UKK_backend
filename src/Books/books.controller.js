const express = require("express");
const response = require("../../resTemp");
const prisma = require("../../db");
const jwt = require("jsonwebtoken");

const multer = require("multer");
const fs = require("fs");
const csv = require("csv-parser");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../perpustakaan_UKK_frontend/imageFile/booksCover/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

let errorImage = false;

const fileFilter = (req, file, cb) => {
  const typeImage = ["image/jpeg", "image/png", "image/jpg"];

  if (typeImage.includes(file.mimetype)) {
    errorImage = false;
    cb(null, true);
  } else {
    errorImage = true;
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter,
  limits: {
    fileSize: 2000000,
  },
});

const storageCSV = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./fileCSVImport");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const uploadCSV = multer({
  storage: storageCSV,
  limits: {
    fileSize: 50000000,
  },
});

const findCodeSchool = (tokenRequest) => {
  let token = tokenRequest;
  let splitToken = token.split(" ", 2);
  token = splitToken[1];
  const tokenFind = jwt.decode(token);
  return tokenFind.kodeSekolah;
};

const findDataUser = (tokenRequest) => {
  let token = tokenRequest;
  let splitToken = token.split(" ", 2);
  token = splitToken[1];
  const tokenFind = jwt.decode(token);
  return tokenFind;
};

const router = express.Router();

router.post("/add-book-data", async (req, res) => {
  const data = req.body;
  const kodeSekolah = findCodeSchool(req.headers.authorization);

  if (data.Judul != "") {
    if (data.Jumlah != 0) {
      // const bookIdFind = await prisma.buku.count({
      //   where: {
      //     BukuID: data.BukuID,
      //   },
      // });
      // console.log(data.BukuID);
      // console.log(bookFind);

      // if (bookIdFind < 1) {
      let dataBook = {
        BukuID: data.BukuID,
        Gambar: "/imageFile/booksCover/default-cover.jpeg",
        Judul: data.Judul,
        Penulis: data.Penulis,
        Penerbit: data.Penerbit,
        Sinopsis: data.Sinopsis,
        TahunTerbit: data.TahunTerbit,
        Jumlah: data.Jumlah,
        kode_admin: kodeSekolah,
      };
      let dataBeforeAdd = await prisma.buku.count({
        where: {
          Judul: dataBook.Judul,
          Penulis: dataBook.Penulis,
          Penerbit: dataBook.Penerbit,
          Jumlah: dataBook.Jumlah,
          Sinopsis: dataBook.Sinopsis,
          kode_admin: dataBook.kode_admin,
          Gambar: dataBook.Gambar,
        },
      });
      if (dataBeforeAdd > 0)
        return response(400, dataBeforeAdd, res, "data sudah ada");
      await prisma.buku
        .create({
          data: dataBook,
        })
        .then(async () => {
          let dataAfterAdd = await prisma.buku.findMany({
            where: {
              Judul: dataBook.Judul,
              Penulis: dataBook.Penulis,
              Penerbit: dataBook.Penerbit,
              Jumlah: dataBook.Jumlah,
              Sinopsis: dataBook.Sinopsis,
              kode_admin: dataBook.kode_admin,
              Gambar: dataBook.Gambar,
            },
          });
          response(200, dataAfterAdd, res, "buku berhasil terupload");
        });
      // } else {
      //   response(400, {}, res, "id buku sudah tersedia");
      // }
    } else {
      response(400, {}, res, "jumlah buku harus lebih dari 0");
    }
  } else {
    response(400, {}, res, "id dan judul wajib diisi");
  }
});

const results = [];
router.post("/add-book-data/csv", uploadCSV.single("file"), (req, res) => {
  //    fieldname: 'file',
  // originalname: 'data.csv',
  // encoding: '7bit',
  // mimetype: 'text/csv',
  // destination: './fileCSVImport',
  // filename: 'data.csv',
  // path: 'fileCSVImport\\data.csv',
  // size: 87
  console.log("🚀 ~ req:", req.file);
  const kodeSekolah = findCodeSchool(req.headers.authorization);

  fs.createReadStream(`${req.file.destination}/${req.file.filename}`)
    .pipe(csv())
    .on("data", (data) => {
      console.log("🚀 ~ .on ~ data:", data);
      let dataSplit =
        data["Judul;Jumlah;Penulis;Penerbit;Tahun Terbit;;"].split(";");
      console.log(parseInt(dataSplit[4]));
      console.log(parseInt(dataSplit[1]));
      let readyData = {
        Gambar: "/imageFile/booksCover/default-cover.jpeg",
        Judul: dataSplit[0],
        Penulis: dataSplit[2],
        Penerbit: dataSplit[3],
        Sinopsis: "",
        TahunTerbit: parseInt(dataSplit[4]),
        Jumlah: parseInt(dataSplit[1]),
        kode_admin: kodeSekolah,
      };
      console.log("🚀 ~ .on ~ readyData:", readyData);
      results.push(readyData);
    })
    .on("end", async () => {
      for (let i = 0; i < results.length; i++) {
        await prisma.buku
          .count({
            where: {
              Judul: results[i].Judul,
              Jumlah: parseInt(results[i].Jumlah),
              Penerbit: results[i].Penerbit,
              Penulis: results[i].Penulis,
              TahunTerbit: parseInt(results[i].TahunTerbit),
            },
          })
          .then(async (a) => {
            if (a < 1) {
              await prisma.buku.create({ data: results[i] }).then((a) => {
                console.log("🚀 ~ awaitprisma.buku.createMany ~ a:", a);
              });
            }
          });
      }
      fs.unlink(`${req.file.destination}/${req.file.filename}`, (err) =>
        console.log("🚀 ~ .on ~ err:", err)
      );
      return response(200, {}, res, "Berhasil Meninputkan Data");
    });
});

router.put(
  "/add-book-cover/:idBook",
  upload.single("file"),
  async (req, res) => {
    if (!errorImage) {
      const idBook = req.params.idBook;

      console.log(req.file);
      await fs.rename(
        req.file.path,
        `../perpustakaan_UKK_frontend/imageFile/booksCover/${idBook}.jpeg`,
        (err) => {
          console.log(req.file.path);
        }
      );

      await prisma.buku
        .update({
          where: {
            BukuID: idBook,
          },
          data: {
            Gambar: `/imageFile/booksCover/${idBook}.jpeg`,
          },
        })
        .then(() => {
          response(200, {}, res, "berhasil unggah foto buku");
        });
    } else {
      response(400, {}, res, "sistem mendukung file .jpeg , .jpg dan .png");
    }
  }
);

router.put("/update-book/:idBook", async (req, res) => {
  const idBook = req.params.idBook;
  const dataUpdate = req.body;
  const kodeSekolah = findCodeSchool(req.headers.authorization);

  const data = {
    Judul: dataUpdate.Judul,
    Penulis: dataUpdate.Penulis,
    Penerbit: dataUpdate.Penerbit,
    Sinopsis: dataUpdate.Sinopsis,
    TahunTerbit: dataUpdate.TahunTerbit,
    Jumlah: dataUpdate.Jumlah,
    kode_admin: kodeSekolah,
  };
  await prisma.buku
    .update({
      where: {
        BukuID: idBook,
      },
      data: data,
    })
    .then(() => {
      response(200, data, res, "memperbarui data buku berhasil");
    });
});

router.delete("/delete-book/:idBook", async (req, res) => {
  const idBook = req.params.idBook;

  const findBook = await prisma.buku.count({
    where: {
      BukuID: idBook,
    },
  });

  if (findBook > 0) {
    const fileImage =
      await prisma.$queryRaw`SELECT Gambar FROM buku where BukuID=${idBook};`;

    console.log(fileImage[0].Gambar);
    if (fileImage[0].Gambar !== "/imageFile/booksCover/default-cover.jpeg") {
      await fs.unlink(
        "../perpustakaan_UKK_frontend" + fileImage[0].Gambar,
        (err) => {
          if (err) throw err;
          console.log("File deleted!");
        }
      );
      await prisma.buku.update({
        where: {
          BukuID: idBook,
        },
        data: { Gambar: "/imageFile/booksCover/default-cover.jpeg" },
      });
    }

    await prisma.buku
      .delete({
        where: {
          BukuID: idBook,
        },
      })
      .then(() => {
        response(
          200,
          {},
          res,
          `data buku dengan id ${idBook} berhasil dihapus`
        );
      });
  } else {
    response(400, {}, res, `buku dengan id ${idBook} tidak ditemukan`);
  }
});

router.get("/:idBook", async (req, res) => {
  const idBook = req.params.idBook;
  const kode_admin = findCodeSchool(req.headers.authorization);

  const borrowIsBook = await prisma.peminjaman.count({
    where: {
      idBuku: idBook,
      status: 2,
      kodeAdmin: kode_admin,
    },
  });

  const ratingBook = await prisma.ulasan_buku.aggregate({
    where: { idBuku: idBook },
    _avg: { rating: true },
  });

  let dataUserUlasan = [];
  const ulasanBook = await prisma.ulasan_buku
    .findMany({
      where: { idBuku: idBook },
    })
    .then(async (a) => {
      for (let i = 0; i < a.length; i++) {
        let user = await prisma.user.findFirst({
          select: { ProfilAkun: true, Username: true },
          where: { UserID: a[i].idUser },
        });
        let data = [{ ulasan: a[i], userUlasan: user }];
        dataUserUlasan = dataUserUlasan.concat(data);
      }
    });

  await prisma.buku.findMany({ where: { BukuID: idBook } }).then((a) => {
    return response(
      a.length < 1 ? 422 : 200,
      {
        buku: a,
        sedangDipinjam: borrowIsBook,
        rating: ratingBook._avg.rating,
        ulasan: dataUserUlasan,
      },
      res,
      a.length < 1 ? "Data Tidak Tersedia" : "Berhasil Mendapat Data"
    );
  });
});

router.use((err, req, res, next) => {
  if (err.code == "LIMIT_FILE_SIZE") {
    response(400, {}, res, "ukuran file gambar terlalu besar");
  }
});

module.exports = router;
