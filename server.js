const express = require('express');
require('dotenv').config();
const app = express();
app.use(express.json());

app.get('/',(req,res)=>{
    console.log('api working');
    return res.send('api working');
})


app.listen(3000,()=>{
    console.log('server is running');
})