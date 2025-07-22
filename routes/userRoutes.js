const express = require('express');
  const router = express.Router();
  const userController = require('../controllers/user/userController');
  const authController = require('../controllers/user/authController');
  const productController = require('../controllers/user/productController');

  router.get('/signup', authController.showSignupPage);
  router.post('/signup', authController.sendOtp);
  router.get('/verify', authController.showVerifyPage);
  router.post('/verify', authController.verifyOtp);
  router.post('/resend-otp', authController.resendOtp);
  router.get('/signup/complete', authController.showSignupCompleteForm);
  router.post('/signup/complete', authController.completeSignup);
  router.get('/login', (req, res, next) => {
    console.log('Handling GET /login');
    authController.showLoginPage(req, res, next);
  });
  router.post('/login', (req, res, next) => {
    console.log('Handling POST /login');
    authController.loginUser(req, res, next);
  });
  router.get('/forgot-password', authController.showForgotPassword);
  router.post('/forgot-password', authController.handleForgotPassword);
  router.get('/reset-password/:token', authController.showResetPassword);
  router.post('/reset-password/:token', authController.handleResetPassword);
  router.get('/dashboard', (req, res, next) => {
    console.log('Handling GET /dashboard');
    userController.showDashboard(req, res, next);
  });
  router.get('/products/:id', (req, res, next) => {
    console.log(`Handling GET /products/${req.params.id}`);
    productController.showProductDetails(req, res, next);
  });
  router.post('/logout', (req, res, next) => {
    console.log('Handling POST /logout');
    authController.logout(req, res, next);
  });

  // Google SSO routes (commented out until Google auth is implemented)
  /*
  router.get('/auth/google', authController.googleAuth);
  router.get('/auth/google/callback', authController.googleAuthCallback);
  */

  module.exports = router;