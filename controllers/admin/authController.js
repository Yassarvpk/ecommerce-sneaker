const { error } = require("console");

const adminLoginPage = (req, res) => {
  res.render("admin/login", {error: null});
};

const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("Submitted:", email, password); // 👈 DEBUG LOG
    console.log("Expected:", process.env.ADMIN_EMAIL, process.env.ADMIN_PASS);

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASS) {
      req.session.admin = true;

      console.log("✅ Admin session set");

      req.session.save((err) => {
        if (err) {
          console.log("Session save error:", err);
          return res.render("admin/login", { error: "Something went wrong" });
        }
        return res.redirect("/admin/dashboard");
      });
    } else {
      console.log("❌ Invalid credentials");
      return res.render("admin/login", { error: "Invalid credentials" });
    }
  } catch (err) {
    console.log("❌ Error:", err);
    return res.render("admin/login", { error: "Something went wrong" });
  }
};


const adminLogout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin");
  });
};

module.exports = {
  adminLoginPage,
  adminLogin,
  adminLogout,
}