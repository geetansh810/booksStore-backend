const { Order, ProductCart } = require("../models/order");

exports.getOrderById = (req, res, next, id) => {
  Order.findById(id)
    .populate("products.product", "name sellingPrice")
    .exec((err, order) => {
      if (err || !order) {
        return res.status(400).json({
          error: "No order found",
        });
      }
      req.order = order;
      next();
    });
};

exports.createOrder = (req, res) => {
  req.body.order.user = req.profile;
  const order = new Order(req.body.order);

  order.save((err, order) => {
    if (err) {
      return res.status(400).json({
        error: "Failed to save your order in DB",
      });
    }
    res.json(order);
  });
};

exports.getAllOrders = (req, res) => {
  Order.find()
    .populate("user", "_id name")
    .exec((err, orders) => {
      if (err || !orders) {
        return res.status(400).json({
          error: "No orders in DB",
        });
      }
      res.json(orders);
    });
};

exports.getAllOrdersStatus = (req, res) => {
  return res.json(Order.schema.path("status").enumValues);
};

exports.updateOrderStatus = (req, res) => {
  Order.updateOne(
    { _id: req.body.orderId },
    { $set: { status: req.body.status } },
    (err, order) => {
      if (err || !order) {
        return res.status(400).json({
          error: "Can't update the order status",
        });
      }
      res.json(order);
    }
  );
};
