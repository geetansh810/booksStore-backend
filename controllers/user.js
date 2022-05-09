const User = require("../models/user");
const { Order } = require("../models/order");

//find user using user details
exports.getUserById = (req, res, next, id) => {
  User.findById(id).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: "No user found in DB" });
    }
    // console.log(user);
    req.profile = user;
    next();
  });
};

//return user details
exports.getUser = (req, res) => {
  req.profile.salt = undefined;
  req.profile.encry_password = undefined;
  req.profile.createdAt = undefined;
  req.profile.updatedAt = undefined;
  return res.json(req.profile);
};

// exports.getUsers = (req, res) => {
//   User.find({}).exec((err, users) => {
//     if (err || !users) {
//       return res.status(400).json({ error: "No users found in DB" });
//     }
//     res.json(users);
//   });
// };

//update user details
exports.updateUser = (req, res) => {
  User.findByIdAndUpdate(
    { _id: req.profile._id },
    { $set: req.body },
    { new: true, useFindAndModify: false },
    (err, user) => {
      if (err) {
        return res.status(400).json({
          error: "Ypou are not authorized to update this user details",
        });
      }
      user.salt = undefined;
      user.encry_password = undefined;
      user.createdAt = undefined;
      user.updatedAt = undefined;
      res.json(user);
    }
  );
};

//purchase list of the user
exports.userPurchaseList = (req, res) => {
  Order.find({ user: req.profile._id })
    .populate("user", "_id name")
    .exec((err, order) => {
      if (err || !order) {
        return res.status(400).json({
          error: "No order in this account",
        });
      }
      return res.json(order);
    });
};

//add new order to the purchase list of the user
exports.pushOrderInPurchaseList = (req, res, next) => {
  // console.log(req.body);
  let purchases = [];
  let items = [];
  req.body.order.products.forEach((product) => {
    items.push({
      _id: product._id,
      name: product.name,
      subject: product.subject,
      description: product.description,
      category: product.category,
      mrp: product.mrp,
      sellingPrice: product.sellingPrice,
    });
  });
  purchases.push({
    items: items,
    quantity: items.length,
    amount: req.body.order.amount,
    receipt_id: req.body.order.receipt,
    payment_id: req.body.order.paymentId,
    order_id: req.body.order.orderId,
    signature: req.body.order.signature,
  });

  //store in DB
  User.findOneAndUpdate(
    { _id: req.profile._id },
    { $push: { purchases: purchases } },
    { new: true },
    (err, purchases) => {
      if (err) {
        return res.status(400).json({
          error: "Unable to save purchase list",
        });
      }
      next();
    }
  );
};
