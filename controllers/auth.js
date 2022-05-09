const User = require("../models/user");

const { check, validationResult } = require("express-validator");

var jwt = require("jsonwebtoken");
var expressJwt = require("express-jwt");

//register's new user and returns it's details with userId
exports.signup = (req, res) => {
  //checks for validation errors
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: errors.array()[0].msg,
    });
  }

  const user = new User(req.body);
  user.save((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        err: "Not able to save user in DB",
        error: err,
      });
    }

    res.json({
      name: user.name,
      email: user.email,
      id: user._id,
    });
  });
};

exports.signin = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: errors.array()[0].msg,
    });
  }

  const { email, password } = req.body;

  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User email dosn't exists",
      });
    }

    //validate for correct password
    if (!user.authenticate(password)) {
      return res.status(401).json({
        error: "Email and password dosn't match",
      });
    }

    //create token
    const token = jwt.sign({ _id: user._id }, process.env.SECRET);

    //put token in cookie
    res.cookie("token", token, {
      expire: new Date(new Date()).getDate() + 9999,
    });

    //response send to frontend
    const { _id, name, email, role } = user;

    return res.json({
      token,
      user: { _id, name, email, role },
    });
  });
};

//sign-out the user by clearing the token from cookie
exports.signout = (req, res) => {
  res.clearCookie("token");
  res.json({
    message: "User signed-out succesfully",
  });
};

//check for user token authorization in the cookies
exports.isSignedIn = expressJwt({
  secret: process.env.SECRET,
  userProperty: "auth",
});

//authentication of user
exports.isAuthenticated = (req, res, next) => {
  const checker = req.profile && req.auth && req.profile._id == req.auth._id;
  if (!checker) {
    return res.status(403).json({
      error: "ACCESS DENIED",
    });
  }
  next();
};

//check for admin access
exports.isAdmin = (req, res, next) => {
  if (req.profile.role === 0) {
    return res.status(403).json({
      error: "ADMIN ACCESS DENIED",
    });
  }
  next();
};
