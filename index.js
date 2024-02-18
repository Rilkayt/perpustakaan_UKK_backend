const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

const loginController = require("./src/Login/login.controllers");
const registerController = require("./src/Register/register.controller");

app.use("/login", loginController);
app.use("/register", registerController);

app.listen(3000, () => {
  console.log("run in port 3000");
});
