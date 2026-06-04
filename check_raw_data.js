const mongoose = require('mongoose');
require('dotenv').config({ path: './PaswordManager/backend/.env' });

const MONGO_URI = process.env.DATABASE_URL;

async function test() {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    
    console.log('\n--- STORED PASSWORDS (RAW) ---');
    const passwords = await db.collection('storedpasswords').find({}).toArray();
    passwords.forEach(p => {
      console.log(`ID: ${p._id}, Site: ${p.site}, Password String: ${p.password}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
