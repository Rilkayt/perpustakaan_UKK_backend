const express = require("express");
const response = require("../../resTemp");
const prisma = require("../../db");

const multer = require("multer");
const imageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "imageFile/booksCover/");
  },
  filename: async (req, file, cb) => {
    const fileName = await prisma.buku.findMany({
      where: {
        BukuID,
      },
    });
    if (fileName != "" || null) {
      response(404, {}, res, "idBukuNothing");
    } else {
      cb(null, fileName);
    }
  },
});
const uploads = multer({ Storage: imageConfig });

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
    response(400, {}, res, "id, judul dan jumlah buku  wajib diisi");
  }
});

module.exports = router;
