const jwt = require('jsonwebtoken');

const authenticate = async(req,res,next)=>{

    try{
       const token = req.cookies.token;
        if(!token) return res.status(401).json({msg:'acess denied please login'});
        // if token found decode it
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decoded; 
        next();
    }
    catch(err){
        console.log(err);
        return res.status(500).json({err:err});
    }
}
module.exports = authenticate
