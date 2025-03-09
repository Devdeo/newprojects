import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      req.body;
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ error: "Missing required payment details" });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error("Missing RAZORPAY_KEY_SECRET");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Create the payload as "order_id|payment_id"
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;

    // Generate the expected signature
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    // Compare the generated signature with the received signature
    if (expectedSignature === razorpay_signature) {
      //
      return res.status(200).json({
        dev: "success",
        success: true,
        message: "Payment verified successfully",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } else {
      // Signature does not match – return error
      return res.status(400).json({ error: "Payment verification failed 13443" });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      error: "Payment verification failed",
      message: error.message,
    });
  }
}
