const isAdmin = (req, res, next) => {
  console.log("🔒 adminAuth middleware hit");
  console.log("Session data:", req.session);

  if (req.session && req.session.admin) {
    console.log("✅ Admin authenticated");
    next();
  } else {
    console.log("❌ Admin not authenticated. Redirecting to /admin");
    res.redirect("/admin");
  }
};

module.exports = { isAdmin };