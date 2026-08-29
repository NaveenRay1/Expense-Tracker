
const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const { sendPasswordResetEmail } = require("../utils/emailService");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// ==========================================
// REGISTER USER
// ==========================================

const registerUser = async (req, res) => {
    try {
        const { userName, email, password } = req.body;

        const user = await User.findOne({
            where: { email }
        });

        if (user) {
            return res.status(400).json({
                message: "user already exist"
            });
        }

        const hashPass = await bcrypt.hash(password, 10);

        await User.create({
            userName,
            email,
            password: hashPass
        });

        return res.redirect("/login");

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            message: "Something went wrong while registering"
        });
    }
};


// ==========================================
// LOGIN USER
// ==========================================

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "email and password can't be empty"
            });
        }

        const user = await User.findOne({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({
                message: "email or password is incorrect"
            });
        }

        const check = await bcrypt.compare(
            password,
            user.password
        );

        if (!check) {
            return res.status(401).json({
                message: "email or password is incorrect"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.redirect("/dashboard");

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            message: "Something went wrong while logging in"
        });
    }
};


// ==========================================
// CHANGE PASSWORD
// ==========================================

const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required"
            });
        }

        const user = await User.findOne({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({
                message: "user not found"
            });
        }

        const check = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!check) {
            return res.status(401).json({
                message: "credentials are wrong"
            });
        }

        const newPasswordHash = await bcrypt.hash(
            newPassword,
            10
        );

        user.password = newPasswordHash;

        await user.save();

        return res.status(200).json({
            message: "password changed successfully"
        });

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            message: "Something went wrong while changing password"
        });
    }
};


// ==========================================
// FORGOT PASSWORD
// ==========================================


const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "email is required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            where: {
                email: normalizedEmail
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Invalidate previous unused reset links
        await PasswordReset.update(
            {
                isUsed: true
            },
            {
                where: {
                    userId: user.id,
                    isUsed: false
                }
            }
        );

        // Generate secure reset token
        const token = crypto
            .randomBytes(32)
            .toString("hex");

        // Token expires in 15 minutes
        const expiresAt = new Date(
            Date.now() + 15 * 60 * 1000
        );

        // Save reset token
        await PasswordReset.create({
            token,
            expiresAt,
            userId: user.id,
            isUsed: false
        });

        if (!process.env.RESET_PASSWORD_URL) {
            console.error(
                "RESET_PASSWORD_URL is not configured"
            );

            return res.status(500).json({
                message:
                    "Password reset service is not configured"
            });
        }

        const resetLink =
            `${process.env.RESET_PASSWORD_URL}?token=${encodeURIComponent(token)}`;

        // Send reset email
        await sendPasswordResetEmail(
            user.email,
            resetLink
        );

        // Never return the reset token
        return res.status(200).json({
            message:
                "Password reset link has been sent to your email."
        });

    } catch (err) {
        console.error(
            "Forgot password error:",
            err.message
        );

        return res.status(500).json({
            message:
                "Unable to send password reset email"
        });
    }
};



// ==========================================
// RESET PASSWORD
// ==========================================

const resetPassword = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                message: "reset token is required"
            });
        }

        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                message: "password can't be empty"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "passwords don't match"
            });
        }

        const forgotPass = await PasswordReset.findOne({
            where: { token }
        });

        if (!forgotPass) {
            return res.status(404).json({
                message: "invalid token"
            });
        }

        // Token cannot be reused or expired
        if (
            forgotPass.isUsed ||
            forgotPass.expiresAt <= new Date()
        ) {
            return res.status(400).json({
                message: "link expired or already used. Please create a new link"
            });
        }

        const user = await User.findOne({
            where: {
                id: forgotPass.userId
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "user not found"
            });
        }

        const hashPass = await bcrypt.hash(
            newPassword,
            10
        );

        user.password = hashPass;

        await user.save();

        // Invalidate token after successful reset
        forgotPass.isUsed = true;

        await forgotPass.save();

        return res.status(200).json({
            message: "password reset successfully"
        });

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            message: "Something went wrong while resetting password"
        });
    }
};


// ==========================================
// LOGOUT USER
// ==========================================

const logoutUser = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: false,
            sameSite: "lax"
        });

        return res.status(200).json({
            message: "successfully logged out"
        });

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            message: "Something went wrong while logging out"
        });
    }
};


module.exports = {
    registerUser,
    loginUser,
    changePassword,
    forgotPassword,
    resetPassword,
    logoutUser
};

