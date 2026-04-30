const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, 'database.json');

// Initialize database file
if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify({ users: [], complaints: [], feedback: [], lastId: 1000 }, null, 2));
}

function readDB() {
  const data = fs.readFileSync(dbFile, 'utf-8');
  return JSON.parse(data);
}

function writeDB(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

const db = {
  // Users
  getUserByMobile: (mobile_number) => {
    const data = readDB();
    return data.users.find(u => u.mobile === mobile_number);
  },
  createUser: (user) => {
    const data = readDB();
    const newUser = { id: Date.now().toString(), ...user };
    data.users.push(newUser);
    writeDB(data);
    return newUser;
  },

  // Complaints
  createComplaint: (complaint) => {
    const data = readDB();
    const nextId = (data.lastId || 1000) + 1;
    const newComplaint = {
      id: nextId.toString(),
      ...complaint,
      status: 'Submitted',
      priority: 'Medium',
      assignedTo: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.complaints.push(newComplaint);
    data.lastId = nextId;
    writeDB(data);
    return newComplaint;
  },
  getAllComplaints: () => {
    const data = readDB();
    return data.complaints.map(c => {
      const user = data.users.find(u => u.id === c.user_id) || {};
      return { ...c, user_name: user.name, mobile_number: user.mobile };
    });
  },
  getComplaintById: (id) => {
    const data = readDB();
    const c = data.complaints.find(c => c.id === id.toString());
    if (!c) return null;
    const user = data.users.find(u => u.id === c.user_id) || {};
    return { ...c, user_name: user.name, mobile_number: user.mobile };
  },
  getComplaintsByUserId: (userId) => {
    const data = readDB();
    return data.complaints
      .filter(c => c.user_id === userId)
      .map(c => {
        const user = data.users.find(u => u.id === c.user_id) || {};
        return { ...c, user_name: user.name, mobile_number: user.mobile };
      });
  },
  updateComplaint: (id, updates) => {
    const data = readDB();
    const idx = data.complaints.findIndex(c => c.id === id.toString());
    if (idx !== -1) {
      const oldStatus = data.complaints[idx].status;
      const oldWorker = data.complaints[idx].assignedTo;
      
      const updatedItem = { 
        ...data.complaints[idx], 
        ...updates, 
        last_updated_by_name: updates.updated_by_name || data.complaints[idx].last_updated_by_name || 'System',
        updated_at: new Date().toISOString() 
      };

      // Add to history if status or assignment changed
      if (!updatedItem.history) updatedItem.history = [];
      
      if (updates.status && updates.status !== oldStatus) {
        updatedItem.history.push({
          type: 'status_change',
          from: oldStatus,
          to: updates.status,
          updated_by: updates.updated_by_name || 'System',
          timestamp: new Date().toISOString()
        });
      }
      
      if (updates.assignedTo && updates.assignedTo !== oldWorker) {
        updatedItem.history.push({
          type: 'assignment',
          from: oldWorker,
          to: updates.assignedTo,
          updated_by: updates.updated_by_name || 'System',
          timestamp: new Date().toISOString()
        });
      }

      data.complaints[idx] = updatedItem;
      writeDB(data);
      return data.complaints[idx];
    }
    return null;
  },
  
  // Feedback
  addFeedback: (feedback) => {
    const data = readDB();
    const newFeedback = { id: Date.now().toString(), ...feedback, createdAt: new Date().toISOString() };
    if (!data.feedback) data.feedback = [];
    data.feedback.push(newFeedback);
    writeDB(data);
    return newFeedback;
  },
  getFeedbackByComplaintId: (complaintId) => {
    const data = readDB();
    if (!data.feedback) return null;
    return data.feedback.find(f => f.complaintId === complaintId.toString());
  },

  // Admin Management
  findAdminByEmail: (email) => {
    const data = readDB();
    if (!data.admins) return null;
    return data.admins.find(a => a.email === email);
  }
};

module.exports = db;
