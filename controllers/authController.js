const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sequelize = require('sequelize');

const registerUser = async(req,res)=>{
    try{
        const {UserName,email,password} = req.body;
        // now we can check them in database specially email if email exist then can't create
        const user = await User.findOne({where:{email:email}});
        if(user){
            console.log('user already exists');
            return res.status(400).json({message:'user already exist'});

        }
        // else we will create a user
        // firstly hash the pass
        const hashPass =await bcrypt.hash(password,10);
       const data= await User.create({UserName,email,password:hashPass});
        console.log('user created');
        return res.status(201).json({message:'user created',data:data});
    }
    catch(err){
        console.log(err);
        return res.status(500).json({err:err});
    }
}

const loginUser = async(req,res)=>{
    try{
        // gonna get data first
        const {email,password} = req.body;
        if(!email || !password)return res.status(400).json({msg:'email and pass cant be empty'})
            
        const user = await User.findOne({where:{email:email}});
        
        if(!user)return res.status(404).json({msg:'email or password is incorrect'});
        // if found compare password
        const check = await bcrypt.compare(password,user.password);
        if(!check)return res.status(404).json({msg:'email or password is incorrect'});

        const token = jwt.sign(
            { id: user.id, email: user.email },  // payload
            process.env.JWT_SECRET,               // secret key from .env
            { expiresIn: '1h' }                   // token expires in 1 hour
        );

    return res.status(200).json({ message: 'successfully logged in', token: token });
        console.log('sucess');
        
    }
    catch(err) {
        console.log(err);
        return res.status(500).json({ err: err });
    }
}

module.exports = {registerUser,loginUser};
