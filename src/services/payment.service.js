const razorpay    = require('../config/razorpay');
const Order       = require('../models/Order.model');
const Course      = require('../models/course.model');
const User        = require('../models/user.model');
const crypto = require('crypto'); // built-in Node.js module — no install needed

// ─── CREATE ORDER ──────────────────────────────────────────────────────────
const createOrder = async (userId, courseId) => {

  // ── 1. Check course exists and is published ──────────────────────────────
  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error('Course not found');
  }
  if (!course.isPublished) {
    throw new Error('This course is not available for purchase');
  }

  // ── 2. Check user hasn't already bought this course ──────────────────────
  const user = await User.findById(userId);
  const alreadyEnrolled = user.enrolledCourses.some(
    (id) => id.toString() === courseId.toString()
  );
  if (alreadyEnrolled) {
    throw new Error('You have already purchased this course');
  }

  // ── 3. Check if a pending order already exists (user clicked Buy twice) ──
  const existingPendingOrder = await Order.findOne({
    user:   userId,
    course: courseId,
    status: 'pending',
  });
  if (existingPendingOrder) {
    // Return the existing order instead of creating a duplicate
    return {
      orderId:         existingPendingOrder._id,
      razorpayOrderId: existingPendingOrder.razorpayOrderId,
      amount:          existingPendingOrder.amount,
      currency:        existingPendingOrder.currency,
      courseName:      course.title,
      keyId:           process.env.RAZORPAY_KEY_ID,
    };
  }

  // ── 4. Convert price to paise (Razorpay requires smallest currency unit) ──
  const amountInPaise = course.price * 100; // ₹1999 → 199900

  // ── 5. Create order on Razorpay ──────────────────────────────────────────
  const razorpayOrder = await razorpay.orders.create({
    amount:   amountInPaise,
    currency: 'INR',
    receipt:  `receipt_     {userId}_${courseId}_${Date.now()}`,
    notes: {
      courseId:   courseId.toString(),
      userId:     userId.toString(),
      courseName: course.title,
    },
  });

  // ── 6. Save order in our database ────────────────────────────────────────
  const order = await Order.create({
    user:            userId,
    course:          courseId,
    amount:          amountInPaise,
    currency:        'INR',
    status:          'pending',
    razorpayOrderId: razorpayOrder.id, // "order_XXXXXXXXXX"
  });

  // ── 7. Return everything frontend needs to open Razorpay popup ───────────
  return {
    orderId:         order._id,           // our internal DB order id
    razorpayOrderId: razorpayOrder.id,    // razorpay's order id
    amount:          amountInPaise,
    currency:        'INR',
    courseName:      course.title,
    keyId:           process.env.RAZORPAY_KEY_ID, // frontend needs this
  };
};
// const crypto = require('crypto'); // built-in Node.js module — no install needed

// ─── VERIFY PAYMENT ────────────────────────────────────────────────────────
const verifyPayment = async (
  userId,
  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
) => {

  // ── 1. Find our order using razorpay_order_id ────────────────────────────
  const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
  if (!order) {
    throw new Error('Order not found');
  }

  // ── 2. Make sure this order belongs to the user making the request ────────
  if (order.user.toString() !== userId.toString()) {
    throw new Error('Unauthorized: this order does not belong to you');
  }

  // ── 3. Check order isn't already paid (prevent double processing) ─────────
  if (order.status === 'paid') {
    throw new Error('This order has already been processed');
  }

  // ── 4. Recreate the signature using our secret key ────────────────────────
  const body = razorpay_order_id + '|' + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  // ── 5. Compare signatures ─────────────────────────────────────────────────
  // Use timingSafeEqual to prevent timing attacks
  const isValid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(razorpay_signature)
  );

  if (!isValid) {
    // Mark order as failed
    order.status = 'failed';
    await order.save({ validateBeforeSave: false });
    throw new Error('Payment verification failed. Invalid signature.');
  }

  // ── 6. Update order as paid ───────────────────────────────────────────────
  order.status             = 'paid';
  order.razorpayPaymentId  = razorpay_payment_id;
  order.razorpaySignature  = razorpay_signature;
  order.paidAt             = new Date();
  await order.save({ validateBeforeSave: false });

  // ── 7. Grant course access — add to user's enrolledCourses ───────────────
  await User.findByIdAndUpdate(
    userId,
    { $addToSet: { enrolledCourses: order.course } },
    { new: true }
  );

  // ── 8. Increment course enrolled count ───────────────────────────────────
  await Course.findByIdAndUpdate(
    order.course,
    { $inc: { enrolledCount: 1 } }
  );

  return {
    orderId:            order._id,
    razorpayPaymentId:  razorpay_payment_id,
    courseId:           order.course,
    amount:             order.amount,
    paidAt:             order.paidAt,
  };
};

//webhook server to server [if payment become successfull so it dont wait for frontend to send request to our backend [disaster condition] if frontend faild before calling a backend to update the enrolledcourse : true and grant the course so for avoid this kind of things we use that if anyone  make payment after create_order -> verify_order ->  success_payment [Razorpay server]  to it calls our backend [my server] to grant a permission for access a course and update the courseStatus:paid.

const handleWebhook = async (razorpaySignature, rawBody) => {

  // ── 1. Verify webhook signature ──────────────────────────────────────────
  // Razorpay signs webhooks with your webhook secret (different from API secret)
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)                   // rawBody = raw JSON string, NOT parsed
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(razorpaySignature)
  );

  if (!isValid) {
    throw new Error('Invalid webhook signature');
  }

  // ── 2. Parse the event ────────────────────────────────────────────────────
  const event = JSON.parse(rawBody);
  const eventType = event.event;  // e.g. "payment.captured", "payment.failed"

  console.log(`Webhook received: ${eventType}`);

  // ── 3. Handle specific events ─────────────────────────────────────────────
  if (eventType === 'payment.captured') {
    const payment       = event.payload.payment.entity;
    const razorpayOrderId = payment.order_id;  // "order_XXXXXXXXXX"
    const razorpayPaymentId = payment.id;      // "pay_YYYYYYYYYY"

    // Find order in DB
    const order = await Order.findOne({ razorpayOrderId });
    if (!order) {
      console.log(`Webhook: Order not found for ${razorpayOrderId}`);
      return { received: true }; // still return 200, not an error
    }

    // Skip if already processed (webhook can fire multiple times)
    if (order.status === 'paid') {
      console.log(`Webhook: Order ${order._id} already paid, skipping`);
      return { received: true };
    }

    // Mark order paid
    order.status            = 'paid';
    order.razorpayPaymentId = razorpayPaymentId;
    order.paidAt            = new Date();
    await order.save({ validateBeforeSave: false });

    // Grant course access
    await User.findByIdAndUpdate(
      order.user,
      { $addToSet: { enrolledCourses: order.course } }
    );

    // Increment enrolled count
    await Course.findByIdAndUpdate(
      order.course,
      { $inc: { enrolledCount: 1 } }
    );

    console.log(`Webhook: Access granted for order ${order._id}`);
  }

  if (eventType === 'payment.failed') {
    const payment         = event.payload.payment.entity;
    const razorpayOrderId = payment.order_id;

    await Order.findOneAndUpdate(
      { razorpayOrderId },
      { status: 'failed' }
    );

    console.log(`Webhook: Payment failed for order ${razorpayOrderId}`);
  }

  return { received: true };
};

// update exports
// module.exports = { createOrder , verifyPayment ,};
module.exports = { createOrder, verifyPayment, handleWebhook };
