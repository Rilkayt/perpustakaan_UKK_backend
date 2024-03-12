const express = require("express");
const response = require("../../resTemp");
const prisma = require("../../db");
const jwt = require("jsonwebtoken");

const findUserID = (tokenRequest) => {
  let token = tokenRequest;
  let splitToken = token.split(" ", 2);
  token = splitToken[1];
  const tokenFind = jwt.decode(token);
  //   console.log(tokenFind);
  return tokenFind.UserID;
};

const router = express.Router();

router.post("/add-collection/:idBook", async (req, res) => {
  const idBook = req.params.idBook;
  const idUser = findUserID(req.headers.authorization);

  const data = {};
});

module.exports = router;
