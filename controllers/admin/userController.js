const { toASCII } = require("punycode");
const User = require("../../models/userModels");

const listUsers = async (req, res) => {
  console.log("🔥 /admin/users route hit");

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";
    const searchRegex = new RegExp(search, "i");

    const filter = {
      $or: [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
      ],
    };

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log("Users Found:", users.length);

    res.render("admin/users", {
      users,
      currentPage: page,
      totalPages,
      search,
    });
  } catch (err) {
    console.error("❌ Error in listUsers:", err);
    res.status(500).send("Internal Server Error");
  }
};

const toggleBlock = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if(!user) {
      return res.status(404).send("User not found");
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    const redirectPage = req.query.page ? `?page=${req.query.page}` : "";
    res.redirect(`/admin/users${redirectPage}`);
  } catch (err) {
    console.error("Error toggling block:", err);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  listUsers,
  toggleBlock,
};