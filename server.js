const express = require('express');
require('dotenv').config();
const User = require('./models/User')
const sequelize = require('./config/db')
const authRoutes = require('./routes/authRoutes');
const app = express();
app.use(express.json());


app.use('/auth',authRoutes);

const startSever = async() =>{
    try{
        await sequelize.sync({alter:true})
        .then(()=>console.log('databse connected'))
        app.listen(process.env.PORT,()=>{
            console.log('server is running at port',process.env.PORT);
        })
    }
    catch(err){
        console.log(err);
    }
}
startSever();