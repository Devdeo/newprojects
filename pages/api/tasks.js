
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { title, hours, userId } = req.body;
      
      const taskData = {
        title,
        hours: parseInt(hours),
        status: 'active',
        userId,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'tasks'), taskData);
      
      res.status(200).json({ id: docRef.id, ...taskData });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create task' });
    }
  } else if (req.method === 'GET') {
    try {
      const { userId } = req.query;
      const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', userId));
      const querySnapshot = await getDocs(tasksQuery);
      
      const tasks = [];
      querySnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() });
      });
      
      res.status(200).json(tasks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  }
}
