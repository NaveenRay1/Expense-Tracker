const sequelize = require("../config/db");
const Expense = require("../models/Expense");
const User = require('../models/User');
const {Op} = require('sequelize');
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

    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:59:00`);

    where.date ={
      [Op.gte]:startOfDay,
      [Op.lte]:endOfDay
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
      const expenseId = req.params.id;
      //now get the data
      const {
        amount,
        description,
        category,
        type
      } = req.body;

      const expense = await Expense.findOne({
        where:{
          id:expenseId,
          userId:req.user.id
        },
        
          transaction:t
        
      });
      
      if(!expense){
        await t.rollback();
        return res.status(404).json({msg:"expense not found"});
      }
      //if expense found
      const oldAmount = expense.amount;
      const oldType = expense.type;

      //update
      await expense.update({
        amount,
        description,
        category,
        type
      },
    {
      transaction:t
    }
    );
    const newAmount = amount;
      //case 1 if old and new both r expense
      if(type === "expense" && oldType === "expense"){
        const diff = newAmount-oldAmount;
        await User.increment("totalExpense",{
          by:diff,
          where:{
            id:req.user.id
          },
          transaction:t
        });

      }
      //case 2 if old is expense new is income
      if(type==="income" && oldType==="expense"){
        await User.increment("totalExpense",{
          by:-oldAmount,
          where:{
            id:req.user.id
          },
          transaction:t
        })
      }
      //case 3 old was income new one is expense
      if(type==="expense" && oldType==="income"){
        await User.increment("totalExpense",{
          by:newAmount,
          where:{
            id:req.user.id
          },
          transaction:t
        })
      }
      //done
      await t.commit();
      return res.status(200).json({msg:"updated successfully"});
    }
    catch(err){
     await t.rollback();
      console.log(err.message);
      return res.status(500).json({msg:err.message});
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
            return res.status(404).json({msg:'expense not found'});
        }
        
        // now update total expense
        const amount = expense.amount;
        const deleteExp = await Expense.destroy({where:{id:expenseId,userId:req.user.id},transaction:t});
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
const getTransactionSummary = async(req,res)=>{
  try{
    const {id} = req.user;
    const transactions = await Expense.findAll({
      where:{
        userId:id
      }
    });

    //now traverse and find all
    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach((transaction)=>{
      const amount = Number(transaction.amount);
      if(transaction.type==="expense")totalExpense+=amount;
      else if(transaction.type==="income")totalIncome+=amount;
    });

    const balance = totalIncome-totalExpense;
    return res.status(200).json({
      msg:"fetch successfully",
      data:{
        totalIncome:totalIncome,
        totalExpense:totalExpense,
        balance:balance
      }
    });
  }
  catch(err){
    console.log(err.message);
    return res.status(500).json({msg:err.message});
  }
}

const getDayWiseSummary = async(req,res)=>{
  try{
  const {id} = req.user;
  const {date} = req.query;

  if(!date){
    return res.status(400).json({msg:"date is required"});
  }

  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(`${date}T23:59:59`);

  const transaction = await Expense.findAll({
    where:{
      userId:id,
      date:{
        [Op.gte]:startOfDay,
        [Op.lte]:endOfDay,
      }
    }
  });
  let dayIncome = 0;
  let dayExpense = 0;
  transaction.forEach((t)=>{
    const amount = Number(t.amount);
    if(t.type==="income")dayIncome+=amount;
    else if(t.type==="expense")dayExpense+=amount;
  });
  const dayBalance = dayIncome-dayExpense;

  const allTransactions = await Expense.findAll({
    where:{
      userId:id,
      date:{[Op.lte]:endOfDay}
    }
  });
  let totalIncome=0;
  let totalExpense =0;
  allTransactions.forEach((transaction)=>{
    const amount = Number(transaction.amount);
    if(transaction.type==="income")totalIncome+=amount;
    else if(transaction.type==="expense")totalExpense+=amount;
  });
  const totalBalance = totalIncome-totalExpense;
  return res.status(200).json({
    msg:"fetched successfully",
    data:{
      dayExpense,
      dayIncome,
      dayBalance,
      totalBalance
    }
  });
}
catch(err){
  console.log(err.message);
  return res.status(500).json({
    msg:err.message
  })
}
}
const getReport = async (req, res) => {
  try {
    const { id } = req.user;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        msg: "startDate and endDate are required"
      });
    }

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);

    // Get transactions in the selected date range
    const transactions = await Expense.findAll({
      where: {
        userId: id,
        date: {
          [Op.gte]: start,
          [Op.lte]: end
        }
      },
      order: [["date", "ASC"]]
    });

    let totalIncome = 0;
    let totalExpense = 0;

    // Object to store category-wise expenses
    const categoryWiseExpense = {};

    transactions.forEach((transaction) => {
      const amount = Number(transaction.amount);

      // Calculate income
      if (transaction.type === "income") {
        totalIncome += amount;
      }

      // Calculate expenses
      else if (transaction.type === "expense") {
        totalExpense += amount;

        const category = transaction.category;

        // If category doesn't exist yet
        if (!categoryWiseExpense[category]) {
          categoryWiseExpense[category] = 0;
        }

        // Add amount to category
        categoryWiseExpense[category] += amount;
      }
    });

    const balance = totalIncome - totalExpense;

    return res.status(200).json({
      msg: "Report generated successfully",

      data: {
        startDate,
        endDate,

        totalIncome,
        totalExpense,
        balance,

        categoryWiseExpense,

        transactions
      }
    });

  } catch (err) {
    console.log(err.message);

    return res.status(500).json({
      msg: err.message
    });
  }
};
module.exports = { addExpense ,updateExpense,getAllExpense,deleteExpense,getTransactionSummary,getDayWiseSummary,getReport};
