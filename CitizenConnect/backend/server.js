require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const Admin = require('./models/Admin');
const Feedback = require('./models/Feedback');

// --- MongoDB Connection ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/citizenconnect';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { adminAuth, SECRET_KEY } = require('./middleware/auth');

// --- Email Configuration ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL || 'your-admin@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"]
  }
});

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${JSON.stringify(req.body)}`);
  next();
});

// --- Configuration ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'mock_cloud',
  api_key: process.env.CLOUDINARY_API_KEY || 'mock_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'mock_secret'
});

const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });

const otpStore = new Map(); 

// --- Socket.IO ---
io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// --- Auth Routes ---
app.post('/api/auth/send-otp', async (req, res) => {
  const { mobile_number, name } = req.body;
  
  if (!mobile_number || !/^[0-9]{10}$/.test(mobile_number)) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(mobile_number, { otp, name, expiresAt: Date.now() + 5 * 60000 });

  if (twilioClient) {
    try {
      await twilioClient.messages.create({
        body: `Welcome to Apla Sevak Portal! Your OTP is ${otp}. Do not share this with anyone.तुमच्या तक्रारीबद्दल क्षमस्व. तुमची समस्या लवकरच दूर होईल - \nआपला ऋषिकेश प्रदीप जैस्वाल (शिवसेना नगरसेवक प्रभाग क्रमांक १५)`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+91${mobile_number}`
      });
    } catch (err) {
      console.error('Twilio Error:', err);
      return res.status(500).json({ error: 'Failed to send real OTP via Twilio.' });
    }
  } else {
    console.log(`[MOCK] OTP for ${mobile_number} is ${otp}`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  res.json({ message: 'OTP sent successfully', isMock: !twilioClient });
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const { mobile_number, otp } = req.body;
  const record = otpStore.get(mobile_number);

  if (!record) return res.status(400).json({ error: 'No OTP requested for this number' });
  if (Date.now() > record.expiresAt) return res.status(400).json({ error: 'OTP expired' });
  if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

  otpStore.delete(mobile_number);

  let user = await User.findOne({ mobile: mobile_number });
  if (!user) {
    user = await User.create({ name: record.name || 'Citizen', mobile: mobile_number });
  }

  res.json({ message: 'Login successful', user });
});

app.post('/api/auth/admin-login', async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });

  if (!admin) return res.status(404).json({ error: 'Admin not found' });
  
  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

  if (admin.status !== 'active') return res.status(403).json({ error: 'Account is inactive' });

  const token = jwt.sign(
    { id: admin._id, email: admin.email, role: admin.role, name: admin.name },
    SECRET_KEY,
    { expiresIn: '1d' }
  );

  res.json({
    token,
    admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
  });
});

// --- Complaint Routes ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const handleImageUpload = (file) => {
  return new Promise((resolve, reject) => {
    // 1. If Cloudinary is configured, use it
    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== 'mock_key') {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'citizenconnect' },
        (error, result) => {
          if (result) resolve(result.secure_url);
          else reject(error);
        }
      );
      uploadStream.end(file.buffer);
    } else {
      // 2. Local Fallback
      try {
        const fs = require('fs');
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
        const filePath = path.join(__dirname, 'uploads', filename);
        
        if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
          fs.mkdirSync(path.join(__dirname, 'uploads'));
        }

        fs.writeFileSync(filePath, file.buffer);
        resolve(`/uploads/${filename}`); // Return the relative path
      } catch (err) {
        reject(err);
      }
    }
  });
};

app.post('/api/complaints', upload.array('images', 3), async (req, res) => {
  try {
    let { user_id, issue_type, description, lat, lng, address } = req.body;
    
    // Safety Check: Prevent "undefined" string from crashing Mongoose
    if (!user_id || user_id === 'undefined' || user_id === 'null') {
      user_id = null;
    }

    const image_urls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await handleImageUpload(file);
        image_urls.push(url);
      }
    }

    const count = await Complaint.countDocuments();
    const legacyId = (1000 + count + 1).toString();

    const complaint = await Complaint.create({
      id: legacyId,
      user_id: user_id || null,
      issue_type,
      description,
      location: { 
        lat: parseFloat(lat) || 0, 
        lng: parseFloat(lng) || 0, 
        address 
      },
      image_urls,
      history: [{ type: 'status_change', from: 'None', to: 'Submitted', updated_by: 'System' }]
    });

    const fullComplaint = await Complaint.findById(complaint._id).populate('user_id');

    // Email Notification
    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: process.env.ADMIN_NOTIFY_EMAIL || 'admin@citizen.com',
      subject: `🚨 New Complaint: ${issue_type}`,
      html: `
        <h2>New Civic Complaint Received</h2>
        <p><b>ID:</b> #${legacyId}</p>
        <p><b>Type:</b> ${issue_type}</p>
        <p><b>Desc:</b> ${description}</p>
        <p><b>Address:</b> ${address}</p>
        <hr />
        <a href="http://${req.hostname}:5173/admin/issue/${legacyId}" style="padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">View in Admin Panel</a>
      `
    };
    transporter.sendMail(mailOptions).catch(err => console.error('Email failed:', err.message));

    io.emit('new_complaint', fullComplaint);
    res.status(201).json({ message: 'Complaint submitted', complaint: fullComplaint });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to submit' });
  }
});

app.get('/api/complaints', adminAuth, async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('user_id').sort({ created_at: -1 });
    // Transform to match frontend expectations
    const transformed = complaints.map(c => ({
      ...c._doc,
      user_name: c.user_id?.name,
      mobile_number: c.user_id?.mobile
    }));
    res.json(transformed);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/complaints/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ id: req.params.id }).populate('user_id');
    if (!complaint) return res.status(404).json({ error: 'Not found' });
    
    const feedback = await Feedback.findOne({ complaintId: req.params.id });
    const result = {
      ...complaint._doc,
      user_name: complaint.user_id?.name,
      mobile_number: complaint.user_id?.mobile,
      feedback
    };
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/users/my-complaints', async (req, res) => {
  try {
    const { user_id } = req.query;
    const complaints = await Complaint.find({ user_id }).sort({ created_at: -1 });
    res.json(complaints);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/complaints/:id', adminAuth, async (req, res) => {
  try {
    const { status, assignedTo, priority } = req.body;
    const complaint = await Complaint.findOne({ id: req.params.id });
    if (!complaint) return res.status(404).json({ error: 'Not found' });

    const oldStatus = complaint.status;
    const oldWorker = complaint.assignedTo;

    if (status && status !== oldStatus) {
      complaint.status = status;
      complaint.history.push({ type: 'status_change', from: oldStatus, to: status, updated_by: req.admin.name });
    }
    if (assignedTo && assignedTo !== oldWorker) {
      complaint.assignedTo = assignedTo;
      complaint.history.push({ type: 'assignment', from: oldWorker, to: assignedTo, updated_by: req.admin.name });
    }
    if (priority) complaint.priority = priority;
    
    complaint.updated_at = Date.now();
    await complaint.save();

    io.emit('status_updated', { id: req.params.id, status: complaint.status });
    res.json({ message: 'Updated', complaint });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users/feedback', async (req, res) => {
  try {
    const { complaintId, rating, comment } = req.body;
    const feedback = await Feedback.create({ complaintId, rating, comment });
    res.json({ message: 'Feedback submitted', feedback });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });
    const pending = total - resolved;
    
    // Aggregate by type
    const byTypeData = await Complaint.aggregate([
      { $group: { _id: "$issue_type", count: { $sum: 1 } } }
    ]);
    const byType = {};
    byTypeData.forEach(item => byType[item._id] = item.count);

    res.json({ total, pending, resolved, byType });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/list', adminAuth, async (req, res) => {
  try {
    const admins = await Admin.find({}, '-password');
    res.json(admins);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/create', adminAuth, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await Admin.create({ name, email, password: hashedPassword });
    
    const { password: _, ...adminInfo } = newAdmin._doc;
    res.status(201).json(adminInfo);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Production Frontend Serving ---
app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});
