const express        = require('express');
const router         = express.Router();
const { createOrder, verifyPayment , handleWebhook } = require('../controllers/payment.controller');
const { protect }    = require('../middlewares/auth.middleware');

// All payment routes require authentication
router.post('/create', protect, createOrder);
router.post('/verify', protect, verifyPayment); // add this to verify the payment after create an order
router.post('/webhook', handleWebhook); // NO auth — Razorpay calls this directly

module.exports = router;