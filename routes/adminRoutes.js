const express = require('express');
  const router = express.Router();
  const authController = require('../controllers/admin/authController');
  const userController = require('../controllers/admin/userController');
  const productController = require('../controllers/admin/productController');
  const Category = require('../models/categoryModel');
  const { upload, processImages } = require('../middlewares/imageUpload');

  router.get('/', authController.adminLoginPage);
  router.post('/login', authController.adminLogin);
  router.get('/dashboard', async (req, res) => {
    try {
      const activeTab = req.query.tab || 'users';
      const adminData = {
        users: [],
        userSearch: '',
        currentUserPage: 1,
        totalUserPages: 1,
        categoriesAdmin: [],
        categorySearch: '',
        currentCategoryPage: 1,
        totalCategoryPages: 1,
        productsAdmin: [],
        productSearch: '',
        currentProductPage: 1,
        totalProductPages: 1,
        sortBy: 'latest',
        categoryFilter: '',
        categories: []
      };
      const userData = await userController.listUsers(req, res);
      console.log(`Admin dashboard: Fetched ${userData.users.length} users`);
      const productData = await productController.loadProducts(req, res);
      const categoryPage = parseInt(req.query.categoryPage) || 1;
      const categorySearch = req.query.categorySearch || '';
      const limit = 5;
      let categoryQuery = { isDeleted: false };
      if (categorySearch) {
        categoryQuery.name = { $regex: categorySearch, $options: 'i' };
      }
      const totalCategories = await Category.countDocuments(categoryQuery);
      const totalCategoryPages = Math.ceil(totalCategories / limit);
      const currentCategoryPage = Math.min(Math.max(categoryPage, 1), totalCategoryPages || 1);
      const categoriesAdmin = await Category.find(categoryQuery)
        .sort({ createdAt: -1 })
        .skip((currentCategoryPage - 1) * limit)
        .limit(limit);

      Object.assign(adminData, userData, productData, {
        categoriesAdmin,
        categorySearch,
        currentCategoryPage,
        totalCategoryPages,
        categories: await Category.find({ isDeleted: false })
      });

      res.render('admin/dashboard', {
        adminData,
        message: req.session.message || null,
        activeTab
      });
      delete req.session.message;
    } catch (err) {
      console.error('Error loading admin dashboard:', err.message);
      req.session.message = 'Error loading dashboard';
      res.redirect('/admin');
    }
  });
  router.get('/dashboard/toggle-block/:id', userController.toggleBlock);
  router.get('/dashboard/add-product', productController.loadAddProductForm);
  router.post('/dashboard/add-product', upload, processImages, productController.addProduct);
  router.get('/dashboard/edit-product/:id', productController.loadEditProductForm);
  router.post('/dashboard/edit-product/:id', upload, processImages, productController.updateProduct);
  router.get('/dashboard/delete-product/:id', productController.softDeleteProduct);
  router.post('/dashboard/add-category', async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        req.session.message = 'Category name is required';
        return res.redirect('/admin/dashboard?tab=categories');
      }
      const existingCategory = await Category.findOne({ name, isDeleted: false });
      if (existingCategory) {
        req.session.message = 'Category already exists';
        return res.redirect('/admin/dashboard?tab=categories');
      }
      await Category.create({ name });
      req.session.message = 'Category added successfully';
      res.redirect('/admin/dashboard?tab=categories');
    } catch (err) {
      console.error('Error adding category:', err.message);
      req.session.message = 'Error adding category';
      res.redirect('/admin/dashboard?tab=categories');
    }
  });
  router.get('/dashboard/edit-category/:id', async (req, res) => {
    try {
      const category = await Category.findOne({ _id: req.params.id, isDeleted: false });
      if (!category) {
        req.session.message = 'Category not found';
        return res.redirect('/admin/dashboard?tab=categories');
      }
      res.render('admin/editCategory', { category, message: req.session.message || null });
      delete req.session.message;
    } catch (err) {
      console.error('Error loading category:', err.message);
      req.session.message = 'Error loading category';
      res.redirect('/admin/dashboard?tab=categories');
    }
  });
  router.post('/dashboard/edit-category/:id', async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        req.session.message = 'Category name is required';
        return res.redirect(`/admin/dashboard/edit-category/${req.params.id}?tab=categories`);
      }
      const existingCategory = await Category.findOne({ name, isDeleted: false, _id: { $ne: req.params.id } });
      if (existingCategory) {
        req.session.message = 'Category name already exists';
        return res.redirect(`/admin/dashboard/edit-category/${req.params.id}?tab=categories`);
      }
      await Category.findByIdAndUpdate(req.params.id, { name });
      req.session.message = 'Category updated successfully';
      res.redirect('/admin/dashboard?tab=categories');
    } catch (err) {
      console.error('Error updating category:', err.message);
      req.session.message = 'Error updating category';
      res.redirect(`/admin/dashboard/edit-category/${req.params.id}?tab=categories`);
    }
  });
  router.get('/dashboard/delete-category/:id', async (req, res) => {
    try {
      const category = await Category.findOne({ _id: req.params.id, isDeleted: false });
      if (!category) {
        req.session.message = 'Category not found';
        return res.redirect('/admin/dashboard?tab=categories');
      }
      await Category.findByIdAndUpdate(req.params.id, { isDeleted: true });
      req.session.message = 'Category deleted successfully';
      res.redirect('/admin/dashboard?tab=categories');
    } catch (err) {
      console.error('Error deleting category:', err.message);
      req.session.message = 'Error deleting category';
      res.redirect('/admin/dashboard?tab=categories');
    }
  });
  router.get('/logout', authController.adminLogout);

  module.exports = router;