import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Manhwa from '../models/Manhwa.js';

async function research() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Regex for symbols, numbers, or starts with 'a'
    const regex = /^[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?aA]/;
    
    const all = await Manhwa.find({}).sort({ title: 1 });
    const subset = all.filter(m => regex.test(m.title));
    
    console.log(`Total manhwas matching criteria (Symbols, numbers, A): ${subset.length}`);
    if (subset.length > 0) {
        console.log('Sample items (first 10):');
        subset.slice(0, 10).forEach(m => console.log(`- ${m.title} (${m.slug})`));
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}
research();
