const sequelize = require("../config/db");
const Expense = require("../models/Expense");
const User = require('../models/User');
const addExpense = async (req, res) => {
        const t = await sequelize.transaction();

    try {

    const { amount, description, category, type } = req.body;
    if (!amount || !description || !category || !type){
            await t.rollback();
        return res.status(400).json({ msg: "fill all fields" });
    }
     
    // we also need to add user id right we will have that from middleware

    const { id } = req.user;
    const user = await Expense.create({
      amount,
      description,
      category,
      type,
      userId: id,
    },{transaction:t});
    // add the amount in the totalExpense for the leaderboard
   if(type==='expense') await User.increment('totalExpense',{by:amount,where:{id:id},transaction:t});
    // now done
    await t.commit();
    console.log(user);
    return res.status(201).json({ msg: "created", data: user });
  } catch (err) {
    (await t).rollback();
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
    const t = await sequelize.transaction();
    try{
        // we gotta update so we will got the data and update that for that we need that expense id
        const expenseId = req.params.id;
        const {amount,description,category,type} = req.body;
        
        // now update

        const user = await Expense.findOne({where:{id:expenseId,userId:req.user.id},transaction:t});
        if(!user){
            await t.rollback();
            return res.status(404).json({msg:'expense not found'});
        }
        const oldAmount = user.amount;
        await user.update({amount,description,category,type},{transaction:t});
        if(oldAmount>amount){
            const val=oldAmount-amount;
           await User.increment('totalExpense',{by:-val , where:{id:req.user.id},transaction:t});
        }else{
            const val = amount-oldAmount;
           await User.increment('totalExpense',{by:val,where:{id:req.user.id},transaction:t});
        }
        await t.commit();
        return res.status(200).json({msg:'updated successfully'});
    }
    catch (err) {
        await t.rollback();
    console.log(err);
    return res.status(500).json({ err: err });
  }
}

const deleteExpense = async(req,res)=>{
    const t =await sequelize.transaction();
    try{
        // get the id find it and delete it
        const expenseId = req.params.id;
       
        const expense = await Expense.findOne({where:{id:expenseId,userId:req.user.id},transaction:t});
        if(!expense){
            await t.rollback();
            return res.status(404).json({msg:'user not found'});
        }
        
        // now update total expense
        const amount = expense.amount;
        const deleteExp = await Expense.destroy({where:{id:expenseId},transaction:t});
     if(expense.type==='expense') await  User.increment('totalExpense',{by:-amount,where:{id:req.user.id},transaction:t});
      await t.commit();
        console.log('deleted',deleteExp);
        return res.status(200).json({msg:'deleted successfully',data:deleteExp});
    }
    catch(err){
        await  t.rollback();
        console.log(err);
        return res.status(500).json({err:err});
    }
}
module.exports = { addExpense ,updateExpense,getAllExpense,deleteExpense};
