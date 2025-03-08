
import Razorpay from "razorpay";
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

    // Update user credit balance in Firebase
    try {
      // Get current user document
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const userData = userSnap.data();
      const currentBalance = userData.creditBalance || 0;
      const newBalance = currentBalance + parseInt(quantity);
      
      // Update user's credit balance
      await updateDoc(userRef, {
        creditBalance: newBalance,
        lastWalletUpdate: serverTimestamp()
      });
      
      // Add transaction record
      const transactionsRef = collection(db, "users", userId, "transactions");
      await addDoc(transactionsRef, {
        type: "credit",
        amount: parseInt(quantity),
        description: `Added ${quantity} credits via Razorpay`,
        paymentId: paymentId,
        orderId: orderId,
        timestamp: serverTimestamp(),
        balance: newBalance
      });
      
      console.log(`Updated credit balance for user ${userId}: +${quantity} credits`);
      
      // Return success
      return res.status(200).json({
        success: true,
        credits: parseInt(quantity),
        newBalance: newBalance,
        message: "Payment verified and credits added successfully"
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({
        error: "Failed to update user credits",
        details: dbError.message
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({
      error: "Failed to verify payment",
      details: error.message
    });
  }
}
