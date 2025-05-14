
import type { NextApiRequest, NextApiResponse } from 'next';
import UserManager, { type User } from '../../src/userManager'; // Use default export and User type

type Data = {
  message?: string;
  userId?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // This API route could be GET or POST. For simplicity, allowing GET for easy browser testing.
  if (req.method === 'GET' || req.method === 'POST') {
    try {
      const userManager = new UserManager();

      const tempUserData: Partial<User> = {
        username: "tempUser",
        password: "tempPassword123", // In a real app, ensure strong, hashed passwords
        workstation: "TemporaryStation",
        permissions: ["read_only_temp", "submit_forms_temp"],
      };

      // Check if a user with this username already exists to prevent duplicates if desired
      // For now, we'll just attempt to create. MongoDB unique index on username would handle this.
      // const existingUser = await userManager.getUserByUsername(tempUserData.username); // Assumes getUserByUsername exists
      // if (existingUser) {
      //   return res.status(409).json({ message: 'Temporary user already exists.' });
      // }

      const newUserId = await userManager.createUser(tempUserData);

      if (newUserId) {
        res.status(201).json({ message: 'Temporary user created successfully', userId: newUserId.toHexString() });
      } else {
        res.status(500).json({ error: 'Failed to create temporary user, createUser returned null' });
      }
    } catch (error: any) {
      console.error('Error creating temporary user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error creating temporary user';
      res.status(500).json({ error: errorMessage });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
