const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

const loginController = require("./src/Login/login.controllers");

app.use("/login", loginController);

app.listen(3000, () => {
  console.log("run in port 3000");
});
