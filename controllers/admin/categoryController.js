const Category = require("../../models/categoryModel");
const { search } = require("../../routes/adminRoutes");

const categoryList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";
    const regex = new RegExp(search, "i");

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

    res.render("admin/categories", {
      categories,
      currentPage: page,
      totalPages,
      search,
      error: null,
      success: null,
    });
  } catch (err) {
    console.error("Error loading categories:", err);
    res.status(500).send("Internal Server Error");
  }
};

const addCategory = async (req, res) => {
  try {
    const name = req.body.name.trim();

    const existing = await Category.findOne({ name: { $regex: new RegExp("^" + name + "$", "i") } });

    if (existing && !existing.isDeleted) {
      // category already exists
      return res.render("admin/categories", {
        categories: [],
        currentPage: 1,
        totalPages: 1,
        search: "",
        error: "Category already exists.",
        success: null,
      });
    }

    if (existing && existing.isDeleted) {
      // Reactivate soft deleted category
      existing.isDeleted = false;
      existing.save();
      return res.redirect("/admin/categories");
    }

    const newCategory = new Category({ name });
    await newCategory.save();

    res.redirect("/admin/categories");
  } catch (err) {
    console.error("Error adding category:", err);
    res.status(500).send("Internal Server Error");
  }
};

const editCategoryForm = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if(!category || category.isDeleted) {
      return res.redirect("/admin/categories");
    }

    res.render("admin/editCategory", {category, error: null});
  } catch (err) {
    console.error("Edit category error:", err);
    res.status(500).send("Internal Server Error");
  }
};

const updateCategory = async (req, res) => {
  try {
    const name = req.body.name.trim();
    const { id } = req.params;

    const exists = await Category.findOne({
      name: { $regex: new RegExp("^" + name + "$", "i")},
      _id: {$ne: id},
      isDeleted: false,
    });

    if (exists) {
      const category = await Category.findById(id);
      return res.render("admin/editCategory", { category, error: "Name already exists" });
    }

    await Category.findByIdAndUpdate(id, { name });

    res.redirect("/admin/categories");
  } catch (err) {
    console.error("Update category error:", err);
    res.status(500).send("Internal Server Error");
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await Category.findByIdAndUpdate(id, { isDeleted: true });
    res.redirect("/admin/categories");
  } catch (err) {
    console.error("❌ Error deleting category:", err.message);
    res.status(500).send("Internal Server Error");
  }
};


const loadCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false}).sort({ createdAt: -1 });
    res.render("admin/categoryList", {categories});
  } catch (err) {
    console.error("Error loading categories:", err.message);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  categoryList,
  addCategory,
  editCategoryForm,
  updateCategory,
  deleteCategory,
  loadCategories,
};