const mongoose = require('mongoose');
//order model
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },

    // Amount in paise (Razorpay uses smallest currency unit)
    // ₹1999 is stored as 199900
    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: 'INR',
    },

    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },

    // Razorpay's order ID — returned when we create order via Razorpay API
    // Format: "order_XXXXXXXXXXXXXXXXXX"
    razorpayOrderId: {
      type: String,
      required: true,
    },

    // Razorpay's payment ID — received AFTER user successfully pays
    // Format: "pay_XXXXXXXXXXXXXXXXXX"
    // null until payment is verified
    razorpayPaymentId: {
      type: String,
      default: null,
    },

    // Razorpay's signature — used to verify payment is genuine
    // null until payment is verified
    razorpaySignature: {
      type: String,
      default: null,
    },

    // When the payment was completed
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt = when order was initiated
  }
);

module.exports = mongoose.model('Order', orderSchema);