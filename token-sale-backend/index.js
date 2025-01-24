const express = require("express");
const Razorpay = require("razorpay");
const cors = require('cors');
app.use(cors({
    origin: '*', // Replace * with your frontend URL for security
    allowedHeaders: ['Content-Type', 'Authorization', 'x-rtb-fingerprint-id']
}));

const app = express();
app.use(express.json());
app.use(cors());  // This enables CORS for all routes

const razorpay = new Razorpay({
  key_id: "rzp_live_CUPDP0bFzjbvdn", // Replace with your Razorpay live key ID
  key_secret: "x4OGSjMf6UIFFS02EbWIMZZ0", // Replace with your Razorpay secret
});

app.post("/verify-payment", async (req, res) => {
  const { paymentId } = req.body;

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    // Check if payment is captured or authorized
    if (payment.status === "captured" || payment.status === "authorized") {
      return res.json({ success: true });
    } else {
      return res.json({ success: false });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
