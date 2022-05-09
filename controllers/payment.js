const Razorpay = require("razorpay");

const dotenv = require("dotenv");
dotenv.config();

var instance = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});

exports.createOrder = (req, res) => {
//   console.log("Request body", req.body);

  const { amount, currency, receipt } = req.body;

  const options = {
    amount: amount*100,
    currency: currency,
    receipt: receipt,
    // notes: {
    //   key1: "value3",
    //   key2: "value2",
    // },
  };

  instance.orders.create(options, (err, order) => {
    if (err) {
      return res.status(500).json(err);
    }
    // console.log(order);
    // res.json(order)
    res.json({
        id: order.id,
        currency: order.currency,
        amount: order.amount
    });
  });
};
