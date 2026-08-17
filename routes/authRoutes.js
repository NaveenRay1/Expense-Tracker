const express = require('express');

const router = express.Router();
const {registerUser,loginUser,changePassword} = require('../controllers/authController');
const authenticate = require('../middlewares/authMiddleware');
router.post('/signup',registerUser);
router.post('/login',loginUser);
router.post('/change-password',authenticate,changePassword);
module.exports = router;