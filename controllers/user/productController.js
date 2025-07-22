// controllers/user/productController.js
const Product = require('../../models/productModel');

exports.showProductDetails = async (req, res) => {
  try {
    if (!req.session.user) {
      req.session.message = 'Please log in to view product details';
      return res.redirect('/login');
    }

    const product = await Product.findOne({ _id: req.params.id, isDeleted: false }).populate('category');
    if (!product) {
      req.session.message = 'Product not found';
      return res.redirect('/dashboard');
    }

    res.render('user/productDetails', {
      product,
      message: req.session.message || null,
    });
    delete req.session.message;
  } catch (err) {
    console.error('❌ Error loading product details:', err.message);
    req.session.message = 'Error loading product details';
    res.redirect('/dashboard');
  }
};

exports.showDashboard = async (req, res) => {
  try {
    if (!req.session.user) {
      req.session.message = 'Please log in to view products';
      return res.redirect('/login');
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || '';
    const categoryFilter = req.query.category || '';
    const sortBy = req.query.sort || 'latest';

    const filter = { isDeleted: false };
    if (searchQuery) filter.name = { $regex: new RegExp(searchQuery, 'i') };
    if (categoryFilter) filter.category = categoryFilter;

    let sortOption = { createdAt: -1 };
    if (sortBy === 'price-asc') sortOption = { price: 1 };
    else if (sortBy === 'price-desc') sortOption = { price: -1 };
    else if (sortBy === 'name-asc') sortOption = { name: 1 };
    else if (sortBy === 'name-desc') sortOption = { name: -1 };

    const products = await Product.find(filter)
      .populate('category')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const categories = await Category.find({ isDeleted: false });

    res.render('user/dashboard', {
      products,
      categories,
      currentPage: page,
      totalPages,
      searchQuery,
      categoryFilter,
      sortBy,
      message: req.session.message || null,
    });
    delete req.session.message;
  } catch (err) {
    console.error('❌ Error loading dashboard:', err.message);
    req.session.message = 'Error loading products';
    res.redirect('/login');
  }
};