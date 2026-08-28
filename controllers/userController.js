
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

module.exports = { getLeaderboard, getLeaderboardData };
