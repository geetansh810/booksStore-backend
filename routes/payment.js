var express = require("express");
var router = express.Router();

const { isSignedIn, isAuthenticated } = require("../controllers/auth");

//razorpay payment gateway
const { createOrder } = require("../controllers/payment");


router.post("/payment/create/:userId", createOrder)





module.exports = router;