const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
import db from "../models/index";

let verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({
      message: "No token provided!"
    });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!"
      });
    }
    req.userId = decoded.id;
    next();
  });
};

let isAdmin = async (req, res, next) => {
  let user = await db.User.findOne({
    where: { id: req.userId }
  })

  if (user.roleId === "R1") {
    next();
    return;
  }
  res.status(403).send({
    message: "Require Admin Role!"
  });
  return;
}

let isDoctor = (req, res, next) => {
  let user = db.User.findOne({
    where: { id: req.userData.user.id }
  })

  if (user.roleId === "R2") {
    next();
    return;
  }
  res.status(403).send({
    message: "Require Doctor Role!"
  });
  return;
};

const authJwt = {
  verifyToken: verifyToken,
  isAdmin: isAdmin,
  isDoctor: isDoctor,
};
module.exports = authJwt;
