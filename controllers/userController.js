
const User = require('../models/User');



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

module.exports = {getLeaderboard};