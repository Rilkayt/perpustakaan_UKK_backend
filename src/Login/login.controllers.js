const express = require("express");
const response = require("../../resTemp");
const prisma = require("../../db");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const router = express.Router();

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

router.post("/", async (req, res) => {
  const inputUser = req.body.user;
  const inputPw = req.body.password;

  if (inputUser != "" && inputPw != "") {
    if (inputUser.includes("@")) {
      let getUser =
        await prisma.$queryRaw`SELECT * FROM User WHERE Email=${inputUser} && Password=${inputPw}`;
      if (getUser.length === 0) {
        response(400, {}, res, "user tidak ditemukan");
      } else {
        let getKodeSchool = await prisma.kode_admin.findMany({
          where: { Sekolah: getUser[0].Sekolah },
        });
        console.log(getKodeSchool);
        console.log(getUser);
        if (getUser.length > 0) {
          let dataUser = {
            UserID: getUser[0].UserID,
            Username: getUser[0].Username,
            Password: getUser[0].Password,
            NoTelp: getUser[0].NoTelp.toString(),
            Email: getUser[0].Email,
            NamaLengkap: getUser[0].NamaLengkap,
            Alamat: getUser[0].Alamat,
            Sekolah: getUser[0].Sekolah,
            Tipe: getUser[0].Tipe,
            profilAkun: getUser[0].ProfilAkun,
            kodeSekolah: getKodeSchool[0].Kode,
          };

          const tokenUser = jwt.sign(dataUser, process.env.TOKEN_SECRET_1);

          let data = {
            token: tokenUser,
            UserID: getUser[0].UserID,
            Username: getUser[0].Username,
            Password: getUser[0].Password,
            NoTelp: getUser[0].NoTelp.toString(),
            Email: getUser[0].Email,
            NamaLengkap: getUser[0].NamaLengkap,
            Alamat: getUser[0].Alamat,
            Sekolah: getUser[0].Sekolah,
            Tipe: getUser[0].Tipe,
            profilAkun: getUser[0].ProfilAkun,
          };

          response(200, data, res, "Berhasil Login");
        } else {
          response(400, {}, res, "Data Tidak Ditemukan");
        }
      }
    } else {
      let getUser =
        await prisma.$queryRaw`SELECT * FROM User WHERE Username=${inputUser} && Password=${inputPw}`;
      if (getUser.length > 0) {
        let getKodeSchool = await prisma.kode_admin.findMany({
          where: { Sekolah: getUser[0].Sekolah },
        });
        if (getUser.length > 0) {
          console.log(getUser);
          let dataUser = {
            UserID: getUser[0].UserID,
            Username: getUser[0].Username,
            Password: getUser[0].Password,
            NoTelp: getUser[0].NoTelp.toString(),
            Email: getUser[0].Email,
            NamaLengkap: getUser[0].NamaLengkap,
            Alamat: getUser[0].Alamat,
            Sekolah: getUser[0].Sekolah,
            Tipe: getUser[0].Tipe,
            profilAkun: getUser[0].ProfilAkun,
            kodeSekolah: getKodeSchool[0].Kode,
          };

          const tokenUser = jwt.sign(dataUser, process.env.TOKEN_SECRET_1);

          let data = {
            token: tokenUser,
            UserID: getUser[0].UserID,
            Username: getUser[0].Username,
            Password: getUser[0].Password,
            NoTelp: getUser[0].NoTelp.toString(),
            Email: getUser[0].Email,
            NamaLengkap: getUser[0].NamaLengkap,
            Alamat: getUser[0].Alamat,
            Sekolah: getUser[0].Sekolah,
            Tipe: getUser[0].Tipe,
            profilAkun: getUser[0].ProfilAkun,
          };

          response(200, data, res, "Berhasil Login");
        } else {
          response(400, {}, res, "Data Tidak Ditemukan");
        }
      } else {
        response(400, {}, res, "user tidak ditemukan");
      }
    }
  } else if (inputUser == "" && inputPw == "") {
    response(400, {}, res, "user dan password masih kosong");
  } else if (inputUser == "" && inputPw != "") {
    response(400, {}, res, "user masih kosong");
  } else {
    response(400, {}, res, "password masih kosong");
  }
});

router.get("/check-email/:email", async (req, res) => {
  const email = req.params.email;
  await prisma.user.count({ where: { Email: email } }).then((a) => {
    if (a > 0) {
      response(200, {}, res, "Email ditemukan");
    } else {
      response(400, {}, res, "Email tidak ditemukan");
    }
  });
});

router.put("/change-password/:email", async (req, res) => {
  const email = req.params.email;
  const newPassword = req.body;

  if (newPassword.password == "") {
    response(400, {}, res, "kata sandi dilarang kosong");
    return;
  }
  await prisma.user
    .update({
      where: { Email: email },
      data: { Password: newPassword.password },
    })
    .then((a) => {
      response(200, {}, res, "Berhasil mwngubah password");
    });
});

router.get("/send-otp-forget-password/:email", async (req, res) => {
  const email = req.params.email;
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
    response(400, error, res, "terjadi kesalahan pada system");
  }
});

router.get("/checkOtpForget/:otp", async (req, res) => {
  const otp = parseInt(req.params.otp);
  console.log(otpData.otp);
  console.log(otp);
  if (otp === otpData.otp) {
    response(200, {}, res, "OTP sesuai");
  } else {
    response(400, {}, res, "OTP tidak sesuai");
  }
});

module.exports = router;
