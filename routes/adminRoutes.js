const express = require('express');
const router = express.Router();
const authController = require("../controllers/admin/authController");
const adminAuth = require("../middlewares/adminAuth");
const userController = require("../controllers/admin/userController");
const categoryController = require("../controllers/admin/categoryController");
const productController = require("../controllers/admin/productController");
const { upload, processImages } = require("../middlewares/upload");

router.get("/", authController.adminLoginPage);
router.post("/login", authController.adminLogin);
router.get("/logout", authController.adminLogout);

router.get("/dashboard", adminAuth, (req, res) => {
  res.render("admin/dashboard");
});

router.get("/test", (req, res) => {
  console.log("🔥 Test route hit");
  res.send("Test route working");
});


router.get("/users", adminAuth, userController.listUsers);
router.post("/users/block/:id", adminAuth, userController.toggleBlock);

router.get("/categories", adminAuth, categoryController.categoryList);
router.post("/categories", adminAuth, categoryController.addCategory);
router.get("/categories/edit/:id", adminAuth, categoryController.editCategoryForm);
router.post("/categories/edit/:id", adminAuth, categoryController.updateCategory);
router.get("/categories/delete/:id", adminAuth, categoryController.deleteCategory);

router.get("/products/add", adminAuth, productController.loadAddProductForm);
router.post("/products/add", adminAuth, upload.array("images", 5), processImages, productController.addProduct);

router.get("/products", adminAuth, productController.loadProducts);

router.get("/products/delete/:id", adminAuth, productController.softDeleteProduct);

router.get("/products/edit/:id", adminAuth, productController.loadEditProductForm);
router.post("/products/edit/:id", adminAuth, productController.updateProduct);

module.exports = router;