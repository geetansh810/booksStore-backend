const Product = require("../models/product");
const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");

exports.getProductById = (req, res, next, id) => {
  Product.findById(id)
    .populate("category")
    .exec((err, product) => {
      if (err || !product) {
        return res.status(400).json({
          error: "Product not found in DB",
        });
      }
      req.product = product;
      next();
    });
};

exports.createProduct = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, (err, fields, file) => {
    if (err) {
      res.status(400).json({
        error: "Problem in image",
      });
    }

    // console.log(fields);

    //destructure the fields
    const {
      name,
      subject,
      description,
      mrp,
      sellingPrice,
      category,
      stock,
      edition,
      author,
      condition,
    } = fields;

    //restrictions in product fields
    if (
      !name ||
      !subject ||
      !description ||
      !mrp ||
      !sellingPrice ||
      !category ||
      !stock ||
      !edition ||
      !author ||
      !condition
    ) {
      return res.status(400).json({
        error: "Please provide all the fields",
      });
    }

    let product = new Product(fields);

    //handle file here
    if (file.photo) {
      if (file.photo.size > 2097152) {
        return res.status(400).json({
          error: "File is too big!!!",
        });
      }
      product.photo.data = fs.readFileSync(file.photo.path);
      product.photo.contentType = file.photo.type;
    }

    //save to DB
    product.save((err, product) => {
      if (err) {
        return res.status(400).json({
          errmsg: err,
          error: "Saving product in DB failed",
        });
      }

      res.json(product);
    });
  });
};

exports.getProduct = (req, res) => {
  //to make the response more efficient
  req.product.photo = undefined;

  return res.json(req.product);
};

//middleware
exports.getProductPhoto = (req, res, next) => {
  if (req.product.photo.data) {
    res.set("Content-Type", req.product.photo.contentType);
    return res.send(req.product.photo.data);
  }
  next();
};

exports.deleteProduct = (req, res) => {
  let product = req.product;
  product.remove((err, deletedProduct) => {
    if (err) {
      return res.status(400).json({
        error: "Product deletion failed!!",
      });
    }
    res.json({ message: "Deletion successfull", deletedProduct });
  });
};

exports.updateProduct = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, (err, fields, file) => {
    if (err) {
      res.status(400).json({
        error: "Problem in image",
      });
    }

    // console.log(fields);

    //destructure the fields
    const {
      name,
      subject,
      description,
      mrp,
      sellingPrice,
      category,
      stock,
      edition,
      author,
      condition,
    } = fields;

    //updation code
    let product = req.product;
    product = _.extend(product, fields);

    //handle file here
    if (file.photo) {
      if (file.photo.size > 2097152) {
        return res.status(400).json({
          error: "File is too big!!!",
        });
      }
      product.photo.data = fs.readFileSync(file.photo.path);
      product.photo.contentType = file.photo.type;
    }

    //save to DB
    product.save((err, product) => {
      if (err) {
        return res.status(400).json({
          error: "Updation failed",
        });
      }

      res.json(product);
    });
  });
};

//product listing
exports.getAllProducts = (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 8;
  let sortBy = req.query.sortBy ? req.query.sortBy : "_id";

  Product.find()
    .select("-photo")
    .populate("category")
    .sort([[sortBy, "asc"]])
    .limit(limit)
    .exec((err, products) => {
      if (err || !products) {
        return res.status(400).json({
          error: "No products found",
        });
      }
      res.json(products);
    });
};

//update the inventory
exports.updateStock = (req, res, next) => {
  let allOperations = req.body.order.products.map((eachProduct) => {
    return {
      updateOne: {
        filter: { _id: eachProduct._id },
        update: {
          $inc: { stock: -1, sold: +1 },
        },
      },
    };
  });

  console.log(allOperations);

  Product.bulkWrite(allOperations, {}, (err, products) => {
    if (err || !products) {
      return res.status(400).json({
        error: "Bulk operations failed",
        errmsg: err,
      });
    }

    next();
  });
};

//get all the categories
exports.getAllUniqueProducts = (req, res) => {
  Product.distinct("category", {}, (err, categories) => {
    if (err || !categories) {
      return res.status(400).json({
        error: "No categories found",
      });
    }

    res.json(categories);
  });
};
