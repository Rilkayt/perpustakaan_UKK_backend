const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const response = require("./resTemp");
const path = require("path");

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

const validateUserAdmin = (req, res, next) => {
  let token = req.headers.authorization;
  let splitToken = token.split(" ", 2);
  token = splitToken[1];

  // console.log(process.env.TOKEN_SECRET_1);

  jwt.verify(token, process.env.TOKEN_SECRET_1, (err, decode) => {
    if (err) {
      response(401, {}, res, "token tidak valid");
    } else {
      if (decode.Tipe != "ADMIN" && decode.Tipe != "EMPLOYEE") {
        response(400, {}, res, "USER tidak diperkenankan");
      } else {
        next();
      }
    }
  });
  // console.log(tokenValidate);
};

const validateUser = (req, res, next) => {
  if (req.headers.authorization) {
    let token = req.headers.authorization;
    let splitToken = token.split(" ", 2);
    token = splitToken[1];

    // console.log(process.env.TOKEN_SECRET_1);

    jwt.verify(token, process.env.TOKEN_SECRET_1, (err, decode) => {
      if (err) {
        response(401, {}, res, "token tidak valid");
      } else {
        next();
      }
    });
  } else {
    response(401, {}, res, "token tidak ditemukan");
  }
  // console.log(tokenValidate);
};

const loginController = require("./src/Login/login.controllers");
const registerController = require("./src/Register/register.controller");
const booksController = require("./src/Books/books.controller");
const borrowController = require("./src/Borrow/borrow.controllers");
const categoryController = require("./src/Kategori/kategori.controllers");
const collectionController = require("./src/collection/collection.controllers");
const ulasanController = require("./src/Ulasan/ulasan.controllers");
const getDataController = require("./src/GetData/getData.controllers");

app.use("/login", loginController);
app.use("/register", registerController);
app.use("/books", validateUser, booksController);
app.use("/borrow", validateUser, borrowController);
app.use("/category", validateUser, categoryController);
app.use("/collection", validateUser, collectionController);
app.use("/ulasan", validateUser, ulasanController);
app.use("/get-data", validateUser, getDataController);

app.listen(3000, () => {
  console.log("run in port 3000");
});
