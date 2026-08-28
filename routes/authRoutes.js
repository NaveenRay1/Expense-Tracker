const express = require('express');

const router = express.Router();
const {registerUser,loginUser,changePassword,forgotPassword,resetPassword,logoutUser} = require('../controllers/authController');
const authenticate = require('../middlewares/authMiddleware');
router.post('/signup',registerUser);
router.post('/login',loginUser);
router.post('/change-password',authenticate,changePassword);
router.post('/forgot-password',forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout',logoutUser);
module.exports = router;