// controllers/admin/categoryController.js
const Category = require('../../models/categoryModel');

// List categories with search, pagination, and sorting
const categoryList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const regex = new RegExp(search, 'i');

    const filter = {
      isDeleted: false,
      name: { $regex: regex },
    };

    const total = await Category.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const categories = await Category.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render('admin/categories', {
      categories,
      currentPage: page,
      totalPages,
      search,
      message: req.session.message || null,
    });
    delete req.session.message;
  } catch (err) {
    console.error('Error loading categories:', err.message);
    req.session.message = 'Internal Server Error';
    res.redirect('/admin/categories');
  }
};

// Add category
const addCategory = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    if (!name || name.length < 2) {
      req.session.message = 'Category name must be at least 2 characters';
      return res.redirect('/admin/categories/add');
    }

    const existing = await Category.findOne({
      name: { $regex: new RegExp('^' + name + '$', 'i') },
    });

    if (existing && !existing.isDeleted) {
      req.session.message = 'Category already exists';
      return res.redirect('/admin/categories/add');
    }

    if (existing && existing.isDeleted) {
      existing.isDeleted = false;
      await existing.save();
      req.session.message = 'Category reactivated successfully';
      return res.redirect(`/admin/categories?page=${req.query.page || 1}&search=${encodeURIComponent(req.query.search || '')}`);
    }

    const newCategory = new Category({ name });
    await newCategory.save();
    req.session.message = 'Category added successfully';
    res.redirect(`/admin/categories?page=${req.query.page || 1}&search=${encodeURIComponent(req.query.search || '')}`);
  } catch (err) {
    console.error('Error adding category:', err.message);
    req.session.message = 'Error adding category';
    res.redirect('/admin/categories/add');
  }
};

// Load edit category form
const editCategoryForm = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, isDeleted: false });
    if (!category) {
      req.session.message = 'Category not found';
      return res.redirect('/admin/categories');
    }

    res.render('admin/editCategory', { category, message: req.session.message || null });
    delete req.session.message;
  } catch (err) {
    console.error('Edit category error:', err.message);
    req.session.message = 'Internal Server Error';
    res.redirect('/admin/categories');
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const { id } = req.params;

    if (!name || name.length < 2) {
      const category = await Category.findById(id);
      req.session.message = 'Category name must be at least 2 characters';
      return res.render('admin/editCategory', { category, message: req.session.message });
    }

    const exists = await Category.findOne({
      name: { $regex: new RegExp('^' + name + '$', 'i') },
      _id: { $ne: id },
      isDeleted: false,
    });

    if (exists) {
      const category = await Category.findById(id);
      req.session.message = 'Category name already exists';
      return res.render('admin/editCategory', { category, message: req.session.message });
    }

    await Category.findByIdAndUpdate(id, { name });
    req.session.message = 'Category updated successfully';
    res.redirect(`/admin/categories?page=${req.query.page || 1}&search=${encodeURIComponent(req.query.search || '')}`);
  } catch (err) {
    console.error('Update category error:', err.message);
    req.session.message = 'Error updating category';
    res.redirect(`/admin/categories/edit/${req.params.id}`);
  }
};

// Soft delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findOne({ _id: id, isDeleted: false });
    if (!category) {
      req.session.message = 'Category not found';
      return res.redirect('/admin/categories');
    }

    await Category.findByIdAndUpdate(id, { isDeleted: true });
    req.session.message = 'Category deleted successfully';
    res.redirect(`/admin/categories?page=${req.query.page || 1}&search=${encodeURIComponent(req.query.search || '')}`);
  } catch (err) {
    console.error('Error deleting category:', err.message);
    req.session.message = 'Error deleting category';
    res.redirect('/admin/categories');
  }
};

module.exports = {
  categoryList,
  addCategory,
  editCategoryForm,
  updateCategory,
  deleteCategory,
};