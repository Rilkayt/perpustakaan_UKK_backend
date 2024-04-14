const express = require("express");
const response = require("../../resTemp");
const prisma = require("../../db");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const multer = require("multer");
const fs = require("fs");

let otpData = { otp: "", exp: null };

if (otpData.otp != "") {
  let nowTime = new Date().getTime();

  console.log("waktu sekarang: ", nowTime);
  console.log("waktu berakhir: ", endTime);
  if (nowTime > otpData.exp) {
    otp = "";
    console.log("waktu sekarang: ", nowTime);
    console.log("waktu berakhir: ", endTime);
    return "otp sudah tidak berlaku";
  }
}

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
    fileSize: 999999999999,
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

router.put("/update-data-user", async (req, res) => {
  const dataUser = findDataUser(req.headers.authorization);
  const dataInput = req.body;

  await prisma.user
    .update({
      where: { UserID: dataUser.UserID },
      data: {
        Username: dataInput.username,
        NamaLengkap: dataInput.namaLengkap,
        Alamat: dataInput.alamat,
      },
    })
    .then((a) => {
      response(200, {}, res, "Berhasil Menupdate Data");
    });
});

router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  let otpNumber = await Math.floor(1000 + Math.random() * 9000);

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    // port : 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_ACCOUNT,
      pass: process.env.PASSWORD_ACCOUNT,
    },
  });

  const mailConfig = {
    from: { name: "perpustakaan digital", address: "rilkayt@gmail.com" }, // sender address
    to: [email], // list of receivers
    subject: "OTP Perpustakaan Digital", // Subject line
    text: `Your OTP ${otpNumber}`, // plain text body
  };

  try {
    await transporter.sendMail(mailConfig).then(() => {
      otpData = { otp: otpNumber, exp: new Date().getTime() + 5 * 60 * 1000 };
      response(200, {}, res, "OTP berhasil terkirim ke email yang disediakan");
    });
  } catch (error) {
    response(400, {}, res, "terjadi kesalahan pada system");
  }
});

router.get("/check-email/:email", async (req, res) => {
  const dataUser = findDataUser(req.headers.authorization);

  await prisma.user
    .count({ where: { Email: req.params.email, Sekolah: dataUser.Sekolah } })
    .then((a) => {
      if (a < 1) {
        return response(200, {}, res, "Email Boleh");
      } else {
        return response(400, {}, res, "Email Sudah Ada");
      }
    });
});

router.get("/check-telp/:telp", async (req, res) => {
  const dataUser = findDataUser(req.headers.authorization);

  await prisma.user
    .count({ where: { NoTelp: req.params.telp, Sekolah: dataUser.Sekolah } })
    .then((a) => {
      if (a < 1) {
        return response(200, {}, res, "No Telepon Boleh");
      } else {
        return response(400, {}, res, "No Telepon Sudah Ada");
      }
    });
});

router.get("/check-password/:pass", async (req, res) => {
  const dataUser = findDataUser(req.headers.authorization);

  await prisma.user
    .count({
      where: {
        Password: req.params.pass,
        Email: dataUser.Email,
        Sekolah: dataUser.Sekolah,
      },
    })
    .then((a) => {
      if (a > 0) {
        return response(200, {}, res, "password benar");
      } else {
        return response(400, {}, res, "password salah");
      }
    });
});

router.put("/update-email/:email/:otp", async (req, res) => {
  const dataUser = findDataUser(req.headers.authorization);
  const newEmail = req.params.email;
  const otpUser = req.params.otp;
  console.log("🚀 ~ router.put ~ otpUser:", otpUser);
  console.log("🚀 ~ router.put ~ otpData.otp:", otpData.otp);

  if (parseInt(otpUser) === otpData.otp) {
    await prisma.user
      .update({
        where: { UserID: dataUser.UserID },
        data: { Email: newEmail },
      })
      .then(() => {
        return response(200, {}, res, "Berhasil Mengubah Kata Sandi");
      })
      .catch((err) => {
        console.log("🚀 ~ .then ~ err:", err);
        return response(400, err, res, "Terjadi Kesalahan");
      });
  } else {
    return response(400, {}, res, "Otp salah");
  }
});

router.get("/check-otp-password/:otp", async (req, res) => {
  const otpUser = req.params.otp;

  console.log("🚀 ~ router.get ~ otpData.otp:", otpData.otp);
  if (parseInt(otpUser) == otpData.otp) {
    return response(200, {}, res, "otp benar");
  } else {
    return 400, {}, res, "otp salah";
  }
});

router.put("/update-telp/:telp", async (req, res) => {
  const dataUser = findDataUser(req.headers.authorization);
  const newTelp = req.params.telp;

  await prisma.user
    .update({
      where: { UserID: dataUser.UserID },
      data: { NoTelp: "62" + newTelp },
    })
    .then(() => {
      return response(200, {}, res, "Berhasil Mengubah Nomor Telepon");
    })
    .catch((err) => {
      console.log("🚀 ~ .then ~ err:", err);
      return response(400, err, res, "Terjadi Kesalahan");
    });
});

router.put("/update-password/:pass", async (req, res) => {
  const dataUser = findDataUser(req.headers.authorization);
  const password = req.params.pass;

  await prisma.user
    .update({
      where: { UserID: dataUser.UserID },
      data: { Password: password },
    })
    .then(() => {
      return response(200, {}, res, "Berhasil Mengubah Password");
    })
    .catch((err) => {
      console.log("🚀 ~ .then ~ err:", err);
      return response(400, err, res, "Terjadi Kesalahan");
    });
});

router.put("/update-employee", async (req, res) => {
  const dataUser = findDataUser(req.headers.authorization);
  const dataBody = req.body;

  await prisma.user
    .update({
      where: { Sekolah: dataUser.Sekolah, UserID: dataBody.idUser },
      data: {
        NamaLengkap: dataBody.namaLengkap,
        Email: dataBody.email,
        Password: dataBody.password,
      },
    })
    .then((a) => {
      return response(200, {}, res, "berhasil memperbarui user employee");
    })
    .catch((err) => {
      return response(400, err, res, "terdapat kesalahan");
    });
});

module.exports = router;
