const User = require('../models/User');

const isPremium = async(req,res,next)=>{
    try{
        const userId = req.user.id;

        const user = await User.findOne({where:{id:userId}});
        if(!user)return res.status(404).json({message:"user not found"});

        //check premium

        if(user.isPremium===true)return next();
        return res.status(404).json({message:"user is not premium"});

    }
    catch(err){
        console.error(err);
        return res.status(500).json({message:err.message});
    }

}

module.exports={isPremium};