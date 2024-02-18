const express = require("express");
const response = require("../../resTemp");
const prisma = require("../../db");

const router = express.Router();

router.post("/", async (req, res) => {
  const inputRegister = req.body;

  if (inputRegister.tipe == "ADMIN") {
    let checkCode =
      await prisma.$queryRaw`SELECT * FROM kode_admin WHERE Kode = ${inputRegister.kode_admin}`;
    console.log(checkCode);
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
        await prisma.user.create({
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
        });

        response(200, inputRegister, res, "Register Berhasil !");
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
      await prisma.user.create({
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
      });

      response(200, inputRegister, res, "Register Berhasil !");
    } else if (checkUsername > 0) {
      throw response(400, {}, res, "username sudah tersedia");
    } else if (checkNotelp > 0) {
      throw response(400, {}, res, "No telepon sudah tersedia");
    } else if (checkEmail > 0) {
      throw response(400, {}, res, "Email sudah tersedia");
    }
  }
});

module.exports = router;
