import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from './models/User.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const createAdmin = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('No MONGODB_URI found in .env');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'louayhamdi438@gmail.com';
    const password = 'frivE789456123';
    const username = 'AdminLouay'; // Default username

    let user = await User.findOne({ email });

    if (user) {
      user.role = 'admin';
      // If user wants this exact password, we update it
      user.passwordHash = await bcrypt.hash(password, 12);
      await user.save();
      console.log(`✅ Success! Updated existing user (${email}) to Admin and updated password.`);
    } else {
      user = new User({
        username,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: 'admin'
      });
      await user.save();
      console.log(`✅ Success! Created new Admin account for ${email}.`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
