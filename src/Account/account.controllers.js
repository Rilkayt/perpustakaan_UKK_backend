const express = require("express");
const response = require("../../resTemp");
const prisma = require("../../db");
const jwt = require("jsonwebtoken");

const multer = require("multer");
const fs = require("fs");

const findDataUser = (tokenRequest) => {
  let token = tokenRequest;
  let splitToken = token.split(" ", 2);
  token = splitToken[1];
  const tokenFind = jwt.decode(token);
  // console.log(tokenFind);
  return tokenFind;
};

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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../perpustakaan_UKK_frontend/imageFile/avatarProfile/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter,
  limits: {
    fileSize: 2000000,
  },
});
const router = express.Router();

router.put("/update-image", upload.single("file"), async (req, res) => {
  if (!errorImage) {
    const dataUser = findDataUser(req.headers.authorization);

    console.log(req.file);
    await fs.rename(
      req.file.path,
      `../perpustakaan_UKK_frontend/imageFile/avatarProfile/${dataUser.UserID}.jpeg`,
      (err) => {
        console.log(req.file.path);
      }
    );

    await prisma.user
      .update({
        where: {
          UserID: dataUser.UserID,
        },
        data: {
          ProfilAkun: `/imageFile/avatarProfile/${dataUser.UserID}.jpeg`,
        },
      })
      .then(() => {
        response(200, {}, res, "berhasil unggah foto buku");
      });
  } else {
    response(400, {}, res, "sistem mendukung file .jpeg , .jpg dan .png");
  }
});

module.exports = router;
