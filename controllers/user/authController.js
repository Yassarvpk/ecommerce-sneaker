const User = require('../../models/userModel');
  const bcrypt = require('bcrypt');
  const crypto = require('crypto');
  const sendOtpEmail = require('../../utils/sendOtpEmail');

  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

  const showSignupPage = (req, res) => {
    res.render('user/signup', { message: req.session.message || null, user: req.session.user || null });
    delete req.session.message;
  };

  const sendOtp = async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        req.session.message = 'Please enter a valid email';
        return res.redirect('/signup');
      }

      const existingUser = await User.findOne({ email, isDeleted: false });
      if (existingUser && existingUser.isVerified) {
        req.session.message = 'Email already registered';
        return res.redirect('/signup');
      }

      const otp = generateOtp();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      await User.updateOne(
        { email },
        { $set: { otp, otpExpires, isVerified: false } },
        { upsert: true }
      );

      const emailResult = await sendOtpEmail(email, otp);
      if (!emailResult.success) {
        req.session.message = emailResult.error;
        return res.redirect('/signup');
      }

      req.session.email = email;
      res.render('user/verify', { email, message: req.session.message || null, user: req.session.user || null });
      delete req.session.message;
    } catch (err) {
      console.error('❌ Failed to send OTP:', err.message);
      req.session.message = 'Failed to send OTP. Try again.';
      res.redirect('/signup');
    }
  };

  const showVerifyPage = (req, res) => {
    const email = req.session.email;
    if (!email) {
      req.session.message = 'Session expired. Please try again.';
      return res.redirect('/signup');
    }
    res.render('user/verify', { email, message: req.session.message || null, user: req.session.user || null });
    delete req.session.message;
  };

  const verifyOtp = async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        req.session.message = 'Email and OTP are required';
        return res.render('user/verify', { email: req.session.email, message: req.session.message, user: req.session.user || null });
      }

      const user = await User.findOne({ email, isDeleted: false });
      if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
        req.session.message = 'Invalid or expired OTP';
        return res.render('user/verify', { email, message: req.session.message, user: req.session.user || null });
      }

      req.session.verifiedEmail = email;
      await User.updateOne({ email }, { $set: { otp: null, otpExpires: null } });
      res.redirect('/signup/complete');
    } catch (err) {
      console.error('❌ Error verifying OTP:', err.message);
      req.session.message = 'Error verifying OTP';
      res.render('user/verify', { email: req.session.email, message: req.session.message, user: req.session.user || null });
    }
  };

  const resendOtp = async (req, res) => {
    try {
      const email = req.session.email;
      if (!email) {
        req.session.message = 'Session expired';
        return res.redirect('/signup');
      }

      const user = await User.findOne({ email, isDeleted: false });
      if (!user) {
        req.session.message = 'User not found';
        return res.redirect('/signup');
      }

      const otp = generateOtp();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

      await User.updateOne({ email }, { $set: { otp, otpExpires } });

      const emailResult = await sendOtpEmail(email, otp);
      if (!emailResult.success) {
        req.session.message = emailResult.error;
        return res.render('user/verify', { email, message: req.session.message, user: req.session.user || null });
      }

      req.session.message = 'New OTP sent';
      res.render('user/verify', { email, message: req.session.message, user: req.session.user || null });
    } catch (err) {
      console.error('❌ Error resending OTP:', err.message);
      req.session.message = 'Error resending OTP';
      res.render('user/verify', { email: req.session.email, message: req.session.message, user: req.session.user || null });
    }
  };

  const showSignupCompleteForm = (req, res) => {
    if (!req.session.verifiedEmail) {
      req.session.message = 'Please verify OTP first';
      return res.redirect('/signup');
    }
    res.render('user/signupComplete', { message: req.session.message || null, user: req.session.user || null });
    delete req.session.message;
  };

  const completeSignup = async (req, res) => {
    try {
      const { fullName, password, confirmPassword } = req.body;
      const email = req.session.verifiedEmail;

      if (!email) {
        req.session.message = 'Session expired';
        return res.redirect('/signup');
      }

      if (!fullName || !password || !confirmPassword) {
        req.session.message = 'All fields are required';
        return res.render('user/signupComplete', { message: req.session.message, user: req.session.user || null });
      }

      if (password !== confirmPassword) {
        req.session.message = 'Passwords do not match';
        return res.render('user/signupComplete', { message: req.session.message, user: req.session.user || null });
      }

      if (password.length < 6) {
        req.session.message = 'Password must be at least 6 characters';
        return res.render('user/signupComplete', { message: req.session.message, user: req.session.user || null });
      }

      const existingUser = await User.findOne({ email, isDeleted: false });
      if (existingUser && existingUser.isVerified) {
        req.session.message = 'Email already registered';
        return res.redirect('/signup');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await User.updateOne(
        { email },
        { $set: { fullName, password: hashedPassword, isVerified: true } }
      );

      req.session.user = { email, fullName };
      delete req.session.verifiedEmail;
      req.session.message = 'Signup successful';
      res.redirect('/dashboard');
    } catch (err) {
      console.error('❌ Signup error:', err.message);
      req.session.message = 'Error during signup';
      res.render('user/signupComplete', { message: req.session.message, user: req.session.user || null });
    }
  };

  const showLoginPage = (req, res) => {
    res.render('user/login', { message: req.session.message || null, user: req.session.user || null });
    delete req.session.message;
  };

  const loginUser = async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        req.session.message = 'Email and password are required';
        return res.render('user/login', { message: req.session.message, user: req.session.user || null });
      }

      const user = await User.findOne({ email, isDeleted: false, isBlocked: false });
      if (!user) {
        req.session.message = 'User not found or blocked';
        return res.render('user/login', { message: req.session.message, user: req.session.user || null });
      }

      if (!user.isVerified) {
        req.session.message = 'Please verify your email first';
        return res.render('user/login', { message: req.session.message, user: req.session.user || null });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        req.session.message = 'Incorrect password';
        return res.render('user/login', { message: req.session.message, user: req.session.user || null });
      }

      req.session.user = { id: user._id, email: user.email, fullName: user.fullName };
      console.log('✅ User logged in:', user.email);
      res.redirect('/dashboard');
    } catch (err) {
      console.error('❌ Login error:', err.message);
      req.session.message = 'Error during login';
      res.render('user/login', { message: req.session.message, user: req.session.user || null });
    }
  };

  const showForgotPassword = (req, res) => {
    res.render('user/forgotPassword', { message: req.session.message || null, user: req.session.user || null });
    delete req.session.message;
  };

  const handleForgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        req.session.message = 'Please enter a valid email';
        return res.redirect('/forgot-password');
      }

      const user = await User.findOne({ email, isDeleted: false, isVerified: true });
      if (!user) {
        req.session.message = 'User not found or not verified';
        return res.redirect('/forgot-password');
      }

      const token = crypto.randomBytes(32).toString('hex');
      const resetPasswordExpires = Date.now() + 3600000; // 1 hour

      await User.updateOne(
        { email },
        { $set: { resetPasswordToken: token, resetPasswordExpires } }
      );

      const resetLink = `${req.protocol}://${req.get('host')}/reset-password/${token}`;
      const emailResult = await sendOtpEmail(email, `Click this link to reset your password: ${resetLink}`, 'Password Reset Request');
      if (!emailResult.success) {
        req.session.message = emailResult.error;
        return res.redirect('/forgot-password');
      }

      req.session.message = 'Password reset link sent to your email';
      res.redirect('/forgot-password');
    } catch (err) {
      console.error('❌ Error sending reset link:', err.message);
      req.session.message = 'Error sending reset link';
      res.redirect('/forgot-password');
    }
  };

  const showResetPassword = async (req, res) => {
    try {
      const { token } = req.params;
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        req.session.message = 'Invalid or expired reset token';
        return res.redirect('/forgot-password');
      }

      res.render('user/resetPassword', { token, message: req.session.message || null, user: req.session.user || null });
      delete req.session.message;
    } catch (err) {
      console.error('❌ Error loading reset page:', err.message);
      req.session.message = 'Error loading reset page';
      res.redirect('/forgot-password');
    }
  };

  const handleResetPassword = async (req, res) => {
    try {
      const { token } = req.params;
      const { password, confirmPassword } = req.body;

      if (!password || !confirmPassword) {
        req.session.message = 'All fields are required';
        return res.redirect(`/reset-password/${token}`);
      }

      if (password !== confirmPassword) {
        req.session.message = 'Passwords do not match';
        return res.redirect(`/reset-password/${token}`);
      }

      if (password.length < 6) {
        req.session.message = 'Password must be at least 6 characters';
        return res.redirect(`/reset-password/${token}`);
      }

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        req.session.message = 'Invalid or expired reset token';
        return res.redirect('/forgot-password');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await User.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword, resetPasswordToken: null, resetPasswordExpires: null } }
      );

      req.session.message = 'Password reset successfully';
      res.redirect('/login');
    } catch (err) {
      console.error('❌ Error resetting password:', err.message);
      req.session.message = 'Error resetting password';
      res.redirect(`/reset-password/${token}`);
    }
  };

  const logout = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('❌ Logout error:', err.message);
        req.session.message = 'Error during logout';
        return res.redirect('/dashboard');
      }
      res.redirect('/login');
    });
  };

  module.exports = {
    showSignupPage,
    sendOtp,
    showVerifyPage,
    verifyOtp,
    resendOtp,
    showSignupCompleteForm,
    completeSignup,
    showLoginPage,
    loginUser,
    showForgotPassword,
    handleForgotPassword,
    showResetPassword,
    handleResetPassword,
    logout,
  };