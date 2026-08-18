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
   //now gotta do pagination
   const page =  parseInt(req.query.page) || 1;
   const limit = parseInt(req.query.limit) || 10;
   
    const offset = (page-1)*10;

    const where = {
      userId:id
    };

    // type filtering
    const {type} = req.query;
    
    if(type){
      where.type = type;
    }

    //filtering by category

    const {category} = req.query;

    if(category){
      where.category = category;
    }

    //filter by specific date

    const {date} = req.query;

    const starOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:59:00`);

    where.date ={
      [Op.gte]:startOfDay,
      [op.lte]:endOfDat
    };

    const {startDate,endDate} = req.query;

    if(startDate || endDate){
      where.date = {};

      if(startDate){
        where.date[Op.gte] = new Date(`${startDate}T00:00:00`);
      }

      if(endDate){
        where.date[Op.lte]= new Date(`${endDate}T23:59:00`);
      }
    }

    //sorting
    const sort = req.body.sort || "newest";
    let order;

    if(sort==="oldest"){
      order = [["date","ASC"]];
    }else{
      order = [["date","DESC"]];
    }

    //FETCH TRANSACTION

    const result = await Expense.findAndCountAll({
      where:where,
      limit:limit,
      offset:offset,
      order:order
    });

    const totalItems = result.count;
    const totalPages = Math.ceil(totalItems/limit);

    return res.status(200).json({
      msg: "Transactions fetched successfully",

      data: result.rows,

      pagination: {
        currentPage: page,
        limit: limit,
        totalItems: totalItems,
        totalPages: totalPages
      }
    });

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
