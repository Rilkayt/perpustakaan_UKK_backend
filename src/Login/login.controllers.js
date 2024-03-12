const express = require("express");
const response = require("../../resTemp");
const prisma = require("../../db");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/", async (req, res) => {
  const inputUser = req.body.user;
  const inputPw = req.body.password;

  if (inputUser != "" && inputPw != "") {
    if (inputUser.includes("@")) {
      let getUser =
        await prisma.$queryRaw`SELECT * FROM User WHERE Email=${inputUser} && Password=${inputPw}`;
      let getKodeSchool = await prisma.kode_admin.findMany({
        where: { Sekolah: getUser[0].Sekolah },
      });
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
        };

        response(200, data, res, "Berhasil Login");
      } else {
        response(400, {}, res, "Data Tidak Ditemukan");
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

module.exports = router;
