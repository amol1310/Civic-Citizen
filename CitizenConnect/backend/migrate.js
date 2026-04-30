const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const Admin = require('./models/Admin');
const Feedback = require('./models/Feedback');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/citizenconnect';

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    const dataPath = path.join(__dirname, 'database.json');
    if (!fs.existsSync(dataPath)) {
      console.log('No database.json found. Skipping migration.');
      process.exit(0);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // 1. Migrate Users
    console.log('Migrating Users...');
    const userMap = {}; // oldId -> newId
    for (const u of data.users) {
      const existing = await User.findOne({ mobile: u.mobile });
      if (!existing) {
        const newUser = await User.create({
          name: u.name,
          mobile: u.mobile,
          role: u.role
        });
        userMap[u.id] = newUser._id;
      } else {
        userMap[u.id] = existing._id;
      }
    }

    // 2. Migrate Admins
    console.log('Migrating Admins...');
    for (const a of data.admins || []) {
      const existing = await Admin.findOne({ email: a.email });
      if (!existing) {
        await Admin.create(a);
      }
    }

    // 3. Migrate Complaints
    console.log('Migrating Complaints...');
    for (const c of data.complaints) {
      const existing = await Complaint.findOne({ id: c.id });
      if (!existing) {
        await Complaint.create({
          ...c,
          user_id: userMap[c.user_id] || null
        });
      }
    }

    // 4. Migrate Feedback
    console.log('Migrating Feedback...');
    for (const f of data.feedback || []) {
      const existing = await Feedback.findOne({ complaintId: f.complaintId });
      if (!existing) {
        await Feedback.create(f);
      }
    }

    console.log('Migration Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration Failed:', err);
    process.exit(1);
  }
}

migrate();
