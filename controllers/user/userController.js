const Product = require('../../models/productModel');
    const Category = require('../../models/categoryModel');

    const showDashboard = async (req, res) => {
      try {
        const searchQuery = req.query.search || '';
        const categoryFilter = req.query.category || '';
        const sortBy = req.query.sort || 'latest';
        const priceMin = parseFloat(req.query.priceMin) || 0;
        const priceMax = parseFloat(req.query.priceMax) || Infinity;
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Products per page

        let query = { isDeleted: false, price: { $gte: priceMin, $lte: priceMax } };
        if (searchQuery) {
          query.name = { $regex: searchQuery, $options: 'i' };
        }
        if (categoryFilter) {
          const category = await Category.findOne({ name: categoryFilter, isDeleted: false });
          if (category) {
            query.category = category._id;
          } else {
            query.category = null; // No matching category
          }
        }
        let sortOption = {};
        if (sortBy === 'price-asc') {
          sortOption = { price: 1 };
        } else if (sortBy === 'price-desc') {
          sortOption = { price: -1 };
        } else if (sortBy === 'name-asc') {
          sortOption = { name: 1 };
        } else if (sortBy === 'name-desc') {
          sortOption = { name: -1 };
        } else {
          sortOption = { createdAt: -1 }; // 'latest'
        }
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);
        const currentPage = Math.min(Math.max(page, 1), totalPages || 1);
        const products = await Product.find(query)
          .sort(sortOption)
          .skip((currentPage - 1) * limit)
          .limit(limit)
          .populate('category');
        const categories = await Category.find({ isDeleted: false }) || [];
        res.render('user/dashboard', {
          products,
          categories,
          searchQuery,
          categoryFilter,
          sortBy,
          priceMin,
          priceMax,
          currentPage,
          totalPages,
          message: req.session.message || null,
        });
        delete req.session.message;
      } catch (err) {
        console.error('❌ Error loading dashboard:', err.message);
        req.session.message = 'Error loading dashboard';
        res.redirect('/login');
      }
    };

    module.exports = { showDashboard };