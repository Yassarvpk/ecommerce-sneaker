const Product = require('../../models/productModel');
  const Category = require('../../models/categoryModel');
  const sharp = require('sharp');
  const fs = require('fs');
  const path = require('path');

  console.log('Loading C:\\Projects\\ecommerce-sneaker\\controllers\\admin\\productController.js');

  const loadAddProductForm = async (req, res) => {
    try {
      const categories = await Category.find({ isDeleted: false });
      res.render('admin/addProduct', { categories, message: req.session.message || null });
      delete req.session.message;
    } catch (err) {
      console.error('Error loading form:', err.message);
      req.session.message = 'Internal Server Error';
      res.redirect('/admin/dashboard');
    }
  };

  const addProduct = async (req, res) => {
    try {
      const { name, category, price, stock, description } = req.body;
      const images = req.processedImages;

      if (!name || !category || !price || !stock || !images || images.length < 3) {
        req.session.message = 'Please provide all required fields and at least 3 images';
        return res.redirect('/admin/dashboard/add-product');
      }

      const validCategory = await Category.findOne({ _id: category, isDeleted: false });
      if (!validCategory) {
        req.session.message = 'Invalid category';
        return res.redirect('/admin/dashboard/add-product');
      }

      const product = new Product({
        name,
        category,
        price: parseFloat(price),
        stock: parseInt(stock),
        description,
        images,
      });

      await product.save();
      console.log('✅ Product saved to DB');
      req.session.message = 'Product added successfully';
      res.redirect('/admin/dashboard');
    } catch (err) {
      console.error('❌ Product Save Error:', err.message);
      req.session.message = 'Error adding product';
      res.redirect('/admin/dashboard/add-product');
    }
  };

  const loadProducts = async (req, res) => {
    try {
      const searchQuery = req.query.productSearch || '';
      const page = parseInt(req.query.productPage) || 1;
      const limit = 5;
      const sortBy = req.query.sort || 'latest';
      const categoryFilter = req.query.category || '';

      const query = {
        isDeleted: false,
        name: { $regex: searchQuery, $options: 'i' },
      };
      if (categoryFilter) {
        const category = await Category.findOne({ name: categoryFilter, isDeleted: false });
        if (category) {
          query.category = category._id;
        } else {
          query.category = null;
        }
      }

      let sortOption = { createdAt: -1 };
      if (sortBy === 'price-asc') sortOption = { price: 1 };
      else if (sortBy === 'price-desc') sortOption = { price: -1 };
      else if (sortBy === 'name-asc') sortOption = { name: 1 };
      else if (sortBy === 'name-desc') sortOption = { name: -1 };

      const total = await Product.countDocuments(query);
      const products = await Product.find(query)
        .populate('category')
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit);

      const totalPages = Math.ceil(total / limit);
      const categories = await Category.find({ isDeleted: false });

      return { productsAdmin: products, currentProductPage: page, totalProductPages: totalPages, productSearch: searchQuery, sortBy, categoryFilter, categories };
    } catch (err) {
      console.error('Error loading products:', err.message);
      throw err;
    }
  };

  const softDeleteProduct = async (req, res) => {
    try {
      const productId = req.params.id;
      const product = await Product.findOne({ _id: productId, isDeleted: false });
      if (!product) {
        req.session.message = 'Product not found';
        return res.redirect('/admin/dashboard');
      }

      await Product.findByIdAndUpdate(productId, { isDeleted: true });
      console.log(`Product ${productId} marked as deleted`);
      req.session.message = 'Product deleted successfully';
      res.redirect('/admin/dashboard');
    } catch (err) {
      console.error('Error deleting product:', err.message);
      req.session.message = 'Error deleting product';
      res.redirect('/admin/dashboard');
    }
  };

  const loadEditProductForm = async (req, res) => {
    try {
      const productId = req.params.id;
      const product = await Product.findOne({ _id: productId, isDeleted: false }).populate('category');
      const categories = await Category.find({ isDeleted: false });

      if (!product) {
        req.session.message = 'Product not found';
        return res.redirect('/admin/dashboard');
      }

      res.render('admin/editProduct', { product, categories, message: req.session.message || null });
      delete req.session.message;
    } catch (err) {
      console.error('Error loading edit form:', err.message);
      req.session.message = 'Internal Server Error';
      res.redirect('/admin/dashboard');
    }
  };

  const updateProduct = async (req, res) => {
    try {
      const productId = req.params.id;
      const { name, price, stock, description, category } = req.body;
      const images = req.processedImages;

      if (!name || !price || !stock || !category) {
        req.session.message = 'Please provide all required fields';
        return res.redirect(`/admin/dashboard/edit-product/${productId}`);
      }

      const validCategory = await Category.findOne({ _id: category, isDeleted: false });
      if (!validCategory) {
        req.session.message = 'Invalid category';
        return res.redirect(`/admin/dashboard/edit-product/${productId}`);
      }

      const product = await Product.findOne({ _id: productId, isDeleted: false });
      if (!product) {
        req.session.message = 'Product not found';
        return res.redirect('/admin/dashboard');
      }

      const updateData = {
        name,
        price: parseFloat(price),
        stock: parseInt(stock),
        description,
        category,
      };
      if (images && images.length > 0) {
        for (const oldImage of product.images) {
          try {
            fs.unlinkSync(path.join(__dirname, '../../public', oldImage));
          } catch (err) {
            console.warn('⚠️ Could not delete old image:', oldImage, err.message);
          }
        }
        updateData.images = images;
      }

      await Product.findByIdAndUpdate(productId, updateData);
      console.log(`Product ${productId} updated`);
      req.session.message = 'Product updated successfully';
      res.redirect('/admin/dashboard');
    } catch (err) {
      console.error('Error updating product:', err.message);
      req.session.message = 'Error updating product';
      res.redirect(`/admin/dashboard/edit-product/${productId}`);
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