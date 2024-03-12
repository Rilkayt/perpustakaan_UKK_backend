const express = require("express");
const response = require("../../resTemp");
const prisma = require("../../db");
const jwt = require("jsonwebtoken");

const findCodeSchool = (tokenRequest) => {
  let token = tokenRequest;
  let splitToken = token.split(" ", 2);
  token = splitToken[1];
  const tokenFind = jwt.decode(token);
  return tokenFind.kodeSekolah;
};

const createCategoryID = (categoryName) => {
  let splitCategoryName = categoryName.split(" ").shift();
  let categoryFix = splitCategoryName.toUpperCase();
  let numberRandom = Math.floor(Math.random() * 10000);
  const idFix = `KTG${categoryFix}DGNKD${numberRandom}`;
  //   console.log(idFix);
  return idFix;
};

const router = express.Router();

// for table category_book
router.post("/add-category-book", async (req, res) => {
  const kodeAdmin = findCodeSchool(req.headers.authorization);
  const { nameCategory } = req.body;
  const idCategory = createCategoryID(nameCategory);
  if (nameCategory != "") {
    let data = {
      idKategori: idCategory,
      nama: nameCategory,
      kodeAdmin: kodeAdmin,
    };

    await prisma.kategori_buku.create({ data: data }).then((a) => {
      response(200, a, res, "berhasil menambah kategori buku");
    });
  } else {
    response(400, {}, res, "nama tidak boleh kosong");
  }
});

router.put("/edit-category-book/:idKategori", async (req, res) => {
  const kodeAdmin = findCodeSchool(req.headers.authorization);
  const { nameCategory } = req.body;
  const idCategory = req.params.idKategori;

  if (nameCategory != "") {
    await prisma.kategori_buku
      .update({
        where: { idKategori: idCategory, kodeAdmin: kodeAdmin },
        data: { nama: nameCategory },
      })
      .then((a) => {
        response(200, a, res, "kategori berhasil diubah");
      });
  } else {
    response(400, {}, res, "nama tidak boleh kosong");
  }
});

router.delete("/delete-category-book/:idKategori", async (req, res) => {
  const idCategory = req.params.idKategori;

  const findData = await prisma.kategori_buku.count({
    where: { idKategori: idCategory },
  });

  if (findData > 0) {
    await prisma.kategori_buku_relasi
      .deleteMany({ where: { idKategoriID: idCategory } })
      .then(() => {
        prisma.kategori_buku
          .delete({ where: { idKategori: idCategory } })
          .then((a) => {
            response(200, a, res, "kategori berhasil dihapus");
          });
      });
  } else {
    response(500, {}, res, "id kategori tidak ditemukan");
  }
});

router.get("/", async (req, res) => {
  const kodeAdmin = findCodeSchool(req.headers.authorization);
  await prisma.kategori_buku
    .findMany({ where: { kodeAdmin: kodeAdmin } })
    .then((a) => {
      response(200, a, res, "berhasil mendapatkan data category");
    });
});

// for consume tabel catagory_relasi
router.post("/add-category-book/:idBook/:idCategori", async (req, res) => {
  const idBook = req.params.idBook;
  const idCategory = req.params.idCategori;
  const kodeAdmin = findCodeSchool(req.headers.authorization);

  const countData =
    // await prisma.$queryRaw`SELECT COUNT(idKategoriRelasi) FROM kategori_buku_relasi WHERE idKategoriID=${idCategory} AND idBuku=${idBook} AND kodeAdmin=${kodeAdmin}`;
    await prisma.kategori_buku_relasi.count({
      where: { idKategoriID: idCategory, idBuku: idBook, kodeAdmin: kodeAdmin },
    });
  console.log(countData);

  if (countData < 1) {
    let data = {
      idBuku: idBook,
      idKategoriID: idCategory,
      kodeAdmin: kodeAdmin,
    };

    await prisma.kategori_buku_relasi.create({ data: data }).then((a) => {
      response(200, a, res, "buku berhasil dikategorikan");
    });
  } else {
    response(400, {}, res, "buku telah berada di kategori");
  }
});

module.exports = router;
