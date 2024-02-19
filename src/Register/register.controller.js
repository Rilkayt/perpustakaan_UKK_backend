const express = require("express");
const response = require("../../resTemp");
const prisma = require("../../db");
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
  const inputRegister = req.body;

  if (inputRegister.tipe == "ADMIN") {
    let checkCode =
      await prisma.$queryRaw`SELECT * FROM kode_admin WHERE Kode = ${inputRegister.kode_admin}`;
    // console.log(checkCode);
    if (inputRegister.otp == otpData.otp && inputRegister.otp != "") {
      if (checkCode.length > 0) {
        let checkUsername = await prisma.user.count({
          where: {
            Username: inputRegister.username,
          },
        });

        let checkEmail = await prisma.user.count({
          where: {
            Email: inputRegister.email,
          },
        });

        let checkNotelp = await prisma.user.count({
          where: {
            NoTelp: inputRegister.notelp,
          },
        });

        console.log(checkNotelp);
        if (checkUsername == 0 && checkEmail == 0 && checkNotelp == 0) {
          await prisma.user
            .create({
              data: {
                Username: inputRegister.username,
                Password: inputRegister.password,
                NoTelp: inputRegister.notelp,
                Email: inputRegister.email,
                NamaLengkap: inputRegister.namaLengkap,
                Alamat: inputRegister.alamat,
                Sekolah: inputRegister.sekolah,
                Tipe: inputRegister.tipe,
              },
            })
            .then(() => {
              response(200, inputRegister, res, "Register Berhasil !");
            });
        } else if (checkUsername > 0) {
          throw response(400, {}, res, "username sudah tersedia");
        } else if (checkNotelp > 0) {
          throw response(400, {}, res, "No telepon sudah tersedia");
        } else if (checkEmail > 0) {
          throw response(400, {}, res, "Email sudah tersedia");
        }
      } else {
        throw response(
          400,
          {},
          res,
          "kode admin tidak ditemukan atau tidak valid"
        );
      }
    } else {
      response(400, {}, res, "otp tidak valid");
    }
  } else {
    if (inputRegister.otp == otpData.otp && inputRegister.otp != "") {
      let checkUsername = await prisma.user.count({
        where: {
          Username: inputRegister.username,
        },
      });

      let checkEmail = await prisma.user.count({
        where: {
          Email: inputRegister.email,
        },
      });

      let checkNotelp = await prisma.user.count({
        where: {
          NoTelp: inputRegister.notelp,
        },
      });

      console.log(checkNotelp);
      if (checkUsername == 0 && checkEmail == 0 && checkNotelp == 0) {
        await prisma.user
          .create({
            data: {
              Username: inputRegister.username,
              Password: inputRegister.password,
              NoTelp: inputRegister.notelp,
              Email: inputRegister.email,
              NamaLengkap: inputRegister.namaLengkap,
              Alamat: inputRegister.alamat,
              Sekolah: inputRegister.sekolah,
              Tipe: inputRegister.tipe,
            },
          })
          .then(() => {
            response(200, inputRegister, res, "Register Berhasil !");
          });
      } else if (checkUsername > 0) {
        throw response(400, {}, res, "username sudah tersedia");
      } else if (checkNotelp > 0) {
        throw response(400, {}, res, "No telepon sudah tersedia");
      } else if (checkEmail > 0) {
        throw response(400, {}, res, "Email sudah tersedia");
      }
    } else {
      response(400, {}, res, "otp tidak valid");
    }
  }
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

module.exports = router;
