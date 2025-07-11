const nodemailer = require("nodemailer");
const User = require("../../models/userModels");
const bcrypt = require("bcrypt");

const OTP_STORE = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const showSignupPage = (req, res) => {
  res.render("user/signup", { error: null });
};

const sendOtp = async (req, res) => {
  try {
    const email = req.body.email;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    req.session.otp = otp;
    req.session.email = email;

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"SneakerSpace" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP for Signup",
      text: `Your OTP is: ${otp}`,
    });

    console.log(`✅ OTP sent to ${email}: ${otp}`);
    res.render("user/verify", { email, error: null });
  } catch (err) {
    console.error("❌ Failed to send OTP:", err.message);
    res.render("user/signup", { error: "Failed to send OTP. Try again." });
  }
};


const showVerifyPage = (req, res) => {
  const email = req.session.email;
  if (!email) return res.redirect("/signup");
  res.render("user/verify", { email, error: null });
};


const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (req.session.otp === otp && req.session.email === email) {
    // ✅ OTP correct, store verified email
    req.session.verifiedEmail = email;

    // ✅ Clear old OTP
    delete req.session.otp;
    delete req.session.email;

    // 👉 Redirect to the final signup form
    return res.redirect("/signup/complete");
  } else {
    return res.render("user/verify", { email, error: "❌ Invalid OTP. Try again." });
  }
};


const showLoginPage = (req, res) => {
  res.render("user/login", { error: null });
};


const completeSignup = async (req, res) => {
  const { fullName, password, confirmPassword } = req.body;
  const email = req.session.verifiedEmail;

  if (!email) return res.redirect("/signup");

  if (password !== confirmPassword) {
    return res.render("user/verify", { email, error: "❌ Passwords do not match" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("user/verify", { email, error: "User already exists. Please log in." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ fullName, email, password: hashedPassword });
    await user.save();

    // ✅ Save to session and redirect
    req.session.user = { id: user._id, email: user.email, fullName: user.fullName };
    delete req.session.verifiedEmail;

    return res.redirect("/dashboard");
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).send("Internal Server Error");
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, isBlocked: false });

    if (!user) {
      return res.render("user/login", { error: "User not found or blocked" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("user/login", { error: "Incorrect password" });
    }

    req.session.user = { id: user._id, email: user.email, fullName: user.fullName };
    console.log("✅ User logged in:", user.email);
    res.redirect("/dashboard");

  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.render("user/login", { error: "Something went wrong" });
  }
};

const showSignupCompleteForm = (req, res) => {
  if (!req.session.verifiedEmail) {
    return res.redirect("/signup");
  }
  res.render("user/signupComplete", { error: null });
};



module.exports = {
  showSignupPage,
  sendOtp,
  showVerifyPage,
  verifyOtp,
  showLoginPage,
  completeSignup,
  loginUser,
  showSignupCompleteForm,
};
