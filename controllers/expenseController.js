const Expense = require("../models/Expense");
const User = require('../models/User');
const addExpense = async (req, res) => {
  try {
    const { amount, description, category, type } = req.body;
    if (!amount || !description || !category || !type)
      return res.status(400).json({ msg: "fill all fields" });
    // we also need to add user id right we will have that from middleware

    const { id } = req.user;
    const user = await Expense.create({
      amount,
      description,
      category,
      type,
      userId: id,
    });
    // add the amount in the totalExpense for the leaderboard
    await User.increment('totalExpense',{by:amount,where:{id:id}});
    // now done
    console.log(user);
    return res.status(201).json({ msg: "created", data: user });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ err: err });
  }
};
// get all expenses
const getAllExpense = async (req, res) => {
  try {
    const { id } = req.user;
    // now gotta find them all
    const users =await Expense.findAll({ where: { userId: id } });
    // gott all of them
    console.log(users);
    return res
      .status(200)
      .json({ msg: "got all expenses of user", data: users });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ err: err });
  }
};
// update an expense 
const updateExpense = async(req,res)=>{
    try{
        // we gotta update so we will got the data and update that for that we need that expense id
        const expenseId = req.params.id;
        const {amount,description,category,type} = req.body;
        
        // now update

        const user = await Expense.findOne({where:{id:expenseId,userId:req.user.id}});
        if(!user)return res.status(404).json({msg:'expense not found'});
        const oldAmount = user.amount;
        await user.update({amount,description,category,type});
        if(oldAmount>amount){
            const val=oldAmount-amount;
           await User.increment('totalExpense',{by:-val , where:{id:req.user.id}});
        }else{
            const val = amount-oldAmount;
           await User.increment('totalExpense',{by:val,where:{id:req.user.id}});
        }
        return res.status(200).json({msg:'updated successfully'});
    }
    catch (err) {
    console.log(err);
    return res.status(500).json({ err: err });
  }
}

const deleteExpense = async(req,res)=>{
    try{
        // get the id find it and delete it
        const expenseId = req.params.id;
       
        const expense = await Expense.findOne({where:{id:expenseId,userId:req.user.id}});
        if(!expense)return res.status(404).json({msg:'user not found'});
        // now update total expense
        const amount = expense.amount;
        const deleteExp = await Expense.destroy({where:{id:expenseId}});
      await  User.increment('totalExpense',{by:-amount,where:{id:req.user.id}});
        console.log('deleted',deleteExp);
        return res.status(200).json({msg:'deleted successfully',data:deleteExp});
    }
    catch(err){
        console.log(err);
        return res.status(500).json({err:err});
    }
}
module.exports = { addExpense ,updateExpense,getAllExpense,deleteExpense};
