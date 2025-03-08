import { db } from "../../firebase/config";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
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

    // Update user's credits
    try {
      // Get current user credit info
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      let currentCredits = 0;
      if (userDoc.exists()) {
        currentCredits = userDoc.data().credits || 0;
      }

      // Update credits
      await updateDoc(userDocRef, {
        credits: currentCredits + parseInt(quantity),
        lastUpdated: serverTimestamp()
      });

      // Add transaction record
      const transactionRef = collection(db, `users/${userId}/transactions`);
      await addDoc(transactionRef, {
        orderId: orderId,
        paymentId: paymentId,
        amount: quantity * 10, // Assuming each credit is ₹10
        credits: parseInt(quantity),
        timestamp: serverTimestamp(),
        status: "completed"
      });

      return res.status(200).json({ success: true, message: "Payment verified and credits added" });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ error: "Failed to update user credits", details: dbError.message });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({ 
      error: "Payment verification failed", 
      details: error.message 
    });
  }
}