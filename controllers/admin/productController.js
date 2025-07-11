const Product = require("../../models/productModel");
const Category = require("../../models/categoryModel");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");


// 👉 Load Add Product Form
const loadAddProductForm = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false });
    res.render("admin/addProduct", { categories });
  } catch (err) {
    console.error("Error loading form:", err.message);
    res.status(500).send("Internal Server Error");
  }
};

const addProduct = async (req, res) => {
  try {
    const images = req.body.processedImages;

    if (!images || images.length < 3) {
      return res.status(400).send("At least 3 images required.");
    }

    const product = new Product({
      name: req.body.name,
      category: req.body.category,
      price: req.body.price,
      stock: req.body.stock,
      images: images,
    });

    await product.save();
    console.log("✅ Product saved to DB");

    // ✅ Delete temp files safely here
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const tempPath = path.normalize(file.path);
        try {
          await new Promise((resolve) => setTimeout(resolve, 300)); // Windows fix
          fs.unlinkSync(tempPath); // Sync works better on Windows sometimes
          console.log("🗑️ Deleted:", tempPath);
        } catch (err) {
          console.warn("⚠️ Could not delete temp file:", tempPath, err.message);
        }
      }
    }

    res.redirect("/admin/products");
  } catch (err) {
    console.error("❌ Product Save Error:", err.message);
    res.status(500).send("Product saving failed");
  }
};


const loadProducts = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const sortBy = req.query.sort || "latest";
    const categoryFilter = req.query.category || "";

    const regex = new RegExp(searchQuery, "i");

    const query = {
      isDeleted: false,
      name: { $regex: regex }
    };

    if (categoryFilter) {
      query.category = categoryFilter;
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === "price-asc") sortOption = { price: 1 };
    else if (sortBy === "price-desc") sortOption = { price: -1 };
    else if (sortBy === "name-asc") sortOption = { name: 1 };
    else if (sortBy === "name-desc") sortOption = { name: -1 };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate("category")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);
    const categories = await Category.find({ isDeleted: false });

    res.render("admin/productList", {
      products,
      currentPage: page,
      totalPages,
      searchQuery,
      sortBy,
      categoryFilter,
      categories
    });
  } catch (err) {
    console.error("Error loading products:", err.message);
    res.status(500).send("Internal Server Error");
  }
};


const softDeleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    await Product.findByIdAndUpdate(productId, {isDeleted: true});
    console.log(`Product ${productId} marked as deleted`);
    res.redirect("/admin/products");
  } catch (err) {
    console.error("Error deleting product:", err.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadEditProductForm = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId).populate("category");
    const categories = await Category.find({ isDeleted: false });

    if(!product) return res.status(404).send("Product not found");

    res.render("admin/editProduct", { product, categories });
  } catch (err) {
    console.error("Error loading edit form:", err.message);
    res.status(500).send("Internal Server Error");
  }
};

const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const {name, price, stock, description, category} = req.body;

    await Product.findByIdAndUpdate(productId, {
      name,
      price,
      stock,
      description,
      category,
    });

    console.log(`Product ${productId} updated`);
    res.redirect("/admin/products");
  } catch (err) {
    console.error("Error updating product:", err.message);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  loadAddProductForm,
  addProduct,
  loadProducts,
  softDeleteProduct,
  loadEditProductForm,
  updateProduct,
};
