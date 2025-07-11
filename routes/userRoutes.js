const express = require("express");
const router = express.Router();
const authController = require("../controllers/user/authController");
const isUserAuth = require("../middlewares/userAuth");

router.get("/login", authController.showLoginPage);
router.post("/login", authController.loginUser);

router.get("/signup", authController.showSignupPage);
router.post("/signup/send-otp", authController.sendOtp);
router.post("/signup/verify-otp", authController.verifyOtp);

router.get("/signup/complete", authController.showSignupCompleteForm);
router.post("/signup/complete", authController.completeSignup);


router.get("/dashboard", isUserAuth, (req, res) => {
  res.render("user/dashboard", { email: req.session.user.email });
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/signup");
  });
});


module.exports = router;
