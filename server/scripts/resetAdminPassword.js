import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password || password.length < 8) {
  console.error('Usage: node scripts/resetAdminPassword.js "NEW_PASSWORD"');
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not configured in server/.env');
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: { type: String, select: false },
  role: String,
  status: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

try {
  await mongoose.connect(process.env.MONGODB_URI);

  const email = (process.env.ADMIN_EMAIL || 'admin@primestack.dev').toLowerCase().trim();
  const name = process.env.ADMIN_NAME || 'PrimeStack Admin';
  const hash = await bcrypt.hash(password, 12);

  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        name,
        password: hash,
        role: 'Admin',
        status: 'Active',
      },
      $setOnInsert: { email },
    },
    { new: true, upsert: true, runValidators: true }
  );

  console.log(`Admin account ready: ${user.email}`);
  console.log('Role: Admin');
  console.log('Status: Active');
} catch (error) {
  console.error('Unable to reset admin password:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
