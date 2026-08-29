
const User = require('../models/User');
const sequelize = require('../config/db');



const getLeaderboard = async(req,res)=>{

    try{
        //pagination 
        const page = parseInt(req.query.page)||1;
        const limit = parseInt(req.query.limit) || 10;

        const offset = (page-1)*limit;

        //now fetch
        const result = await User.findAndCountAll({
            attributes:[
                "id",
                "userName",
                "totalExpense"
            ],
            order:[
                ["totalExpense","DESC"]
            ],
            limit:limit,
            offset:offset
        });

        const totalItems = result.count;
        const totalPages = Math.ceil(totalItems/limit);

        return res.status(200).json({
            msg:"leader fetched",
            data:result.rows,
                
             pagination:{
                    page,
                    totalItems,
                    totalPages,
                    limit
                }
            
        });
    }catch(err){
        console.log(err.message);
        return res.status(500).json({msg:err.message});
    }
}

const getLeaderboardData = async (req, res) => {
    try {
        const { page = [1, 10] } = req.body;
        const pageNumber = Number(page[0]) || 1;
        const limit = Number(page[1]) || 10;
        const offset = (pageNumber - 1) * limit;

        const result = await User.findAndCountAll({
            attributes: ["id", "userName", "totalIncome", "totalExpense"],
            order: [[sequelize.literal("(totalIncome - totalExpense)"), "DESC"]],
            limit,
            offset,
        });

        const users = result.rows.map((u) => ({
            userId: u.id,
            userName: u.userName,
            totalIncome: Number(u.totalIncome),
            totalExpense: Number(u.totalExpense),
        }));

        return res.status(200).json({
            msg: "leaderboard fetched",
            users,
            currentUserId: req.user.id,
            startRank: offset,
            count: result.count,
        });
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ msg: err.message });
    }
};


// ==========================================
// UPDATE PROFILE
// ==========================================
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const { userName, email } = req.body;

        if (!userName || !email) {
            return res.status(400).json({
                message: "Name and email are required"
            });
        }

        const trimmedName = userName.trim();
        const trimmedEmail = email.trim().toLowerCase();

        if (trimmedName.length < 2) {
            return res.status(400).json({
                message: "Name must contain at least 2 characters"
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        // Check whether another user already has this email
        const existingUser = await User.findOne({
            where: {
                email: trimmedEmail
            }
        });

        if (existingUser && String(existingUser.id) !== String(userId)) {
            return res.status(409).json({
                message: "This email is already being used by another account"
            });
        }

        const user = await User.findOne({
            where: {
                id: userId
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        user.userName = trimmedName;
        user.email = trimmedEmail;

        await user.save();

        return res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: user.id,
                userName: user.userName,
                email: user.email,
                isPremium: user.isPremium
            }
        });

    } catch (err) {
        console.log("Update profile error:", err.message);

        return res.status(500).json({
            message: "Something went wrong while updating your profile"
        });
    }
};


// ==========================================
// PUBLIC PROFILE
// ==========================================
const getPublicProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findOne({
            where: {
                id: id
            }
        });

        if (!user) {
            return res.status(404).send("User not found");
        }

        const income = Number(user.totalIncome || 0);
        const expense = Number(user.totalExpense || 0);

        let savingsRate = 0;

        if (income > 0) {
            savingsRate = ((income - expense) / income) * 100;
        }

        return res.render("publicProfile", {
            user,
            savingsRate
        });

    } catch (err) {
        console.log("Public profile error:", err.message);

        return res.status(500).send(
            "Something went wrong while loading the profile"
        );
    }
};



module.exports = { getLeaderboard, getLeaderboardData, updateProfile,getPublicProfile };
