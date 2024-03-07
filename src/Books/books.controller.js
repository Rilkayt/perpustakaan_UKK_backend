const express = require("express");
const response = require("../../resTemp");
const prisma = require("../../db");

const multer = require("multer");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./imageFile/booksCover/");
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

const router = express.Router();

router.post("/add-book-data", async (req, res) => {
  const data = req.body;

  if (data.BukuID != "" && data.Judul != "") {
    if (data.Jumlah != 0) {
      const bookIdFind = await prisma.buku.count({
        where: {
          BukuID: data.BukuID,
        },
      });
      // console.log(data.BukuID);
      // console.log(bookFind);

      if (bookIdFind < 1) {
        let dataBook = {
          BukuID: data.BukuID,
          Gambar: "",
          Judul: data.Judul,
          Penulis: data.Penulis,
          Penerbit: data.Penerbit,
          Sinopsis: data.Sinopsis,
          TahunTerbit: data.TahunTerbit,
          Jumlah: data.Jumlah,
        };
        await prisma.buku
          .create({
            data: dataBook,
          })
          .then(() => {
            response(200, dataBook, res, "buku berhasil terupload");
          });
      } else {
        response(400, {}, res, "id buku sudah tersedia");
      }
    } else {
      response(400, {}, res, "jumlah buku harus lebih dari 0");
    }
  } else {
    response(400, {}, res, "id dan judul wajib diisi");
  }
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
        `./imageFile/booksCover/${idBook}.jpg`,
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
            Gambar: `./imageFile/booksCover/${idBook}.jpg`,
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

  const data = {
    Judul: dataUpdate.Judul,
    Penulis: dataUpdate.Penulis,
    Penerbit: dataUpdate.Penerbit,
    Sinopsis: dataUpdate.Sinopsis,
    TahunTerbit: dataUpdate.TahunTerbit,
    Jumlah: dataUpdate.Jumlah,
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
    await fs.unlink(fileImage[0].Gambar, (err) => {
      if (err) throw err;
      console.log("File deleted!");
    });

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

router.use((err, req, res, next) => {
  if (err.code == "LIMIT_FILE_SIZE") {
    response(400, {}, res, "ukuran file gambar terlalu besar");
  }
});

module.exports = router;
