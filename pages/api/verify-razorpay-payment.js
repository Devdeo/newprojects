import Razorpay from "razorpay";
const crypto = require("crypto");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { orderId, paymentId, signature, userId, quantity } = req.body;

    if (!orderId || !paymentId || !signature || !userId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Verify signature
    const text = orderId + "|" + paymentId;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (generatedSignature !== signature) {
      console.error("Signature verification failed");
      return res.status(400).json({ error: "Invalid signature" });
    }

    // If using Firebase, this would update the user's credit balance
    // For now, we'll simulate success
    console.log("Payment verified for user", userId, "adding", quantity, "credits");

    // Return success
    return res.status(200).json({
      success: true,
      credits: parseInt(quantity),
      message: "Payment verified and credits added successfully"
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({
      error: "Failed to verify payment",
      details: error.message
    });
  }
}