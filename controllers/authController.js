const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sequelize = require("sequelize");
const PasswordReset = require("../models/PasswordReset");
const crypto = require("crypto");
const registerUser = async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    // now we can check them in database specially email if email exist then can't create
    const user = await User.findOne({ where: { email: email } });
    if (user) {
      console.log("user already exists");
      return res.status(400).json({ message: "user already exist" });
    }
    // else we will create a user
    // firstly hash the pass
    const hashPass = await bcrypt.hash(password, 10);
    const data = await User.create({ userName, email, password: hashPass });
    console.log("user created");

    return res.redirect("/login");
  } catch (err) {
    console.log(err);
    return res.status(500).json({ err: err });
  }
};

const loginUser = async (req, res) => {
  try {
    // gonna get data first
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ msg: "email and pass cant be empty" });

    const user = await User.findOne({ where: { email: email } });

    if (!user)
      return res.status(401).json({ msg: "email or password is incorrect" });
    // if found compare password
    const check = await bcrypt.compare(password, user.password);
    if (!check)
      return res.status(401).json({ msg: "email or password is incorrect" });

    const token = jwt.sign(
      { id: user.id, email: user.email }, // payload
      process.env.JWT_SECRET, // secret key from .env
      { expiresIn: "7d" }, // token expires in 7d hour
    );

    //put in cookies
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect("/");
    // return res.status(200).json({ message: 'successfully logged in' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ err: err });
  }
};

//change password
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findOne({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "user not found" });
    //got current pass and new pass
    const { currentPassword, newPassword } = req.body;

    const check = await bcrypt.compare(currentPassword, user.password);
    if (!check)
      return res.status(404).json({ message: "credentials are wrong" });
    //if correct just change it
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    user.password = newPasswordHash;
    await user.save();
    return res.status(200).json({ message: "password changed successfully" });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: err.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "email is required" });

    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(404).json({ message: "User not found" });

    //generate token
    const token = crypto.randomBytes(32).toString("hex");
    //toke expire in 15min
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    //now save in model
    await PasswordReset.create({
      token,
      expiresAt,
      userId: user.id,
      isUsed: false,
    });
    //will send email later

    return res.status(201).json({ message: "created token", token });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const { token } = req.query;
    if (!newPassword || !confirmPassword)
      return res.status(400).json({ message: "password can't be empty" });
    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: "passwords don't match" });

    //now validate

    const forgotPass = await PasswordReset.findOne({ where: { token } });
    if (!forgotPass) return res.status(404).json({ message: "invalid token" });
    //find it let's validate
    if (
      forgotPass.isUsed === false &&
      forgotPass.expiresAt >= new Date(Date.now())
    ) {
      //now we will change only

      const hashPass = await bcrypt.hash(newPassword, 10);
      const user = await User.findOne({ where: { id: forgotPass.userId } });
      if (!user) return res.status(400).json({ message: "user nor found" });

      user.password = hashPass;
      await user.save();
      forgotPass.isUsed = true;
      await forgotPass.save();
      return res.status(200).json({ message: "password resets successfully" });
    } else
      return res
        .status(500)
        .json({ message: "link expired create a new link" });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: err.message });
  }
};
const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
    return res.status(200).json({
      message: "successfully logged out",
    });
  } catch (err) {
    console.log(err.message);

    return res.status(500).json({
      message: err.message,
    });
  }
};
module.exports = {
  registerUser,
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
  logoutUser,
};
