
import { auth, db } from "../../firebase/config";
import { doc, getDoc } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the current user from the session
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return res.status(200).json({ authenticated: false });
    }
    
    // Get user data from Firestore
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return res.status(200).json({ 
        authenticated: true,
        user: {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName
        },
        userData: {
          creditBalance: 0
        }
      });
    }
    
    return res.status(200).json({
      authenticated: true,
      user: {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName
      },
      userData: userSnap.data()
    });
  } catch (error) {
    console.error('Error checking authentication:', error);
    return res.status(500).json({ error: 'Failed to check authentication' });
  }
}
