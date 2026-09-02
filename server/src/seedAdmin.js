import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

const run = async () => {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    throw new Error('MONGODB_URI and JWT_SECRET are required');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be configured in production');
  }

  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const hash = await bcrypt.hash(password, 12);

  await User.findOneAndUpdate(
    { email },
    {
      name: process.env.ADMIN_NAME || 'primeStack Admin',
      email,
      password: hash,
      role: 'Admin',
      status: 'Active',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log(`Admin ready: ${email}`);
  await mongoose.disconnect();
};

run().catch(error => {
  console.error(error);
  process.exit(1);
});
