
import type { NextApiRequest, NextApiResponse } from 'next';
import UserManager from '../../src/userManager'; // Use default export

type Data = {
  message?: string;
  userId?: string; // Optionally return the new user's ID
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'POST') {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const userManager = new UserManager();
      // UserManager.createUser now accepts Partial<User> and will apply defaults
      // for workstation and permissions if not provided.
      const newUserId = await userManager.createUser({ username, password });

      if (newUserId) {
        res.status(201).json({ message: 'User created successfully', userId: newUserId.toHexString() });
      } else {
        // This case might occur if createUser returns null due to internal validation (though current one doesn't)
        res.status(500).json({ error: 'Error creating user, createUser returned null' });
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      // Check if error is an instance of Error to safely access message property
      const errorMessage = error instanceof Error ? error.message : 'Unknown error creating user';
      res.status(500).json({ error: errorMessage });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
