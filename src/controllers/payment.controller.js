const paymentService = require('../services/payment.service');

// ─── POST /api/orders/create ───────────────────────────────────────────────
const createOrder = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user._id; // set by auth middleware

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'courseId is required',
      });
    }

    const orderData = await paymentService.createOrder(userId, courseId);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: orderData,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};



// existing createOrder controller stays here...

// ─── POST /api/orders/verify ───────────────────────────────────────────────
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // Validate all three fields are present
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'razorpay_order_id, razorpay_payment_id and razorpay_signature are required',
      });
    }

    const userId = req.user._id;

    const result = await paymentService.verifyPayment(userId, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully. Course access granted!',
      data: result,
    });
  } catch (error) {
    // Distinguish between fraud vs server error
    const status = error.message.includes('Invalid signature') ? 400 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// ─── POST /api/orders/webhook ──────────────────────────────────────────────
const handleWebhook = async (req, res) => {
  try {
    const razorpaySignature = req.headers['x-razorpay-signature'];

    if (!razorpaySignature) {
      return res.status(400).json({ message: 'No signature found' });
    }

    // req.rawBody is the raw string — set up in app.js below
    await paymentService.handleWebhook(razorpaySignature, req.rawBody);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

// module.exports = { createOrder };
module.exports = { createOrder, verifyPayment ,handleWebhook }; // update exports