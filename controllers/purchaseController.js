const { Cashfree, CFEnvironment } = require("cashfree-pg");
const Order = require("../models/Order");
const User = require("../models/User");
// 1. Initialize the Cashfree INSTANCE
const cashfree = new Cashfree(
  CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY,
);

const buyPremium = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    // 2. Generate a unique Order ID string
    const uniqueOrderId = `ORDER_${userId}_${Date.now()}`;

    // 3. Formulate the official Cashfree request body
    const orderRequest = {
      order_amount: 299, // Clean integer
      order_currency: "INR",
      order_id: uniqueOrderId,
      customer_details: {
        customer_id: String(userId),
        customer_email: userEmail,
        customer_phone: "9999999999",
      },
      order_meta: {
        // Some Cashfree versions require this field to exist
        return_url: `http://localhost:3000/purchase/success?order_id=${uniqueOrderId}`,
      },
    };

    // 4. Hit the method with ONLY the request object
    const response = await cashfree.PGCreateOrder(orderRequest);

    // 5. Create local database tracking record
    const newOrder = await Order.create({
      orderId: uniqueOrderId,
      status: "PENDING",
      userId: userId,
    });

    // 6. Respond back with session data
    return res.status(201).json({
      msg: "Order initiated successfully",
      payment_session_id: response.data.payment_session_id,
      orderId: uniqueOrderId,
    });
  } catch (err) {
    console.error(
      "Cashfree Error:",
      err.response ? err.response.data : err.message,
    );
    return res
      .status(500)
      .json({ err: err.response ? err.response.data.message : err.message });
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const { order_id } = req.query;

    console.log(order_id);
    //got order id now got let's got response which contain payments
    const response = await cashfree.PGOrderFetchPayments(order_id);
    console.log(response.data);

    //got response
    const payments = response.data;

    let status;
    if (payments.some((payment) => payment.payment_status === "SUCCESS"))
      status = "SUCCESS";
    else if (payments.some((payment) => payment.payment_status === "PENDING"))
      status = "PENDING";
    else status = "FAILED";

    console.log("Payment status:", status);

    //now update order
    const orderUpdate = await Order.findOne({
      where: { orderId: order_id },
    });

    if (!orderUpdate) {
      return res.status(404).json({
        message: "order not found",
      });
    }

    orderUpdate.status = status;
    await orderUpdate.save();

    if (status === "SUCCESS") {
      const user = await User.findOne({
        where: { id: req.user.id },
      });

      if (!user) {
        return res.status(404).json({
          message: "user not found",
        });
      }

      user.isPremium = true;
      await user.save();
    }

    if (status === "SUCCESS") {
      return res.status(200).json({
        message: "Payment successful, premium purchased",
      });
    }

    if (status === "PENDING") {
      return res.status(200).json({
        message: "Payment is still pending",
      });
    }

    return res.status(200).json({
      message: "Payment failed",
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ err: err.message });
  }
};

module.exports = { buyPremium, getPaymentStatus };
