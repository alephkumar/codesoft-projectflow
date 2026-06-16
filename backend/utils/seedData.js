/**
 * Seed script: creates demo users and sample data
 * Run with: node utils/seedData.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/projectflow';

async function seed(skipConnect = false) {
  if (!skipConnect) {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
  }

  // Clear existing data
  await Promise.all([User.deleteMany({}), Project.deleteMany({}), Task.deleteMany({}), Comment.deleteMany({})]);
  console.log('Cleared existing data');

  // Create users
  const users = await User.insertMany([
    { name: 'Alice Admin', email: 'admin@demo.com', password: await bcrypt.hash('demo123', 12), role: 'admin' },
    { name: 'Peter PM', email: 'pm@demo.com', password: await bcrypt.hash('demo123', 12), role: 'project_manager' },
    { name: 'Mike Member', email: 'member@demo.com', password: await bcrypt.hash('demo123', 12), role: 'team_member' },
    { name: 'Sarah Dev', email: 'sarah@demo.com', password: await bcrypt.hash('demo123', 12), role: 'team_member' },
  ]);

  const [admin, pm, mike, sarah] = users;
  console.log('Created users');

  // Create projects
  const projects = await Project.insertMany([
    {
      name: 'E-Commerce Platform Redesign',
      description: 'Complete overhaul of the customer-facing e-commerce platform with modern UX.',
      status: 'active', priority: 'high',
      startDate: new Date('2025-01-01'), endDate: new Date('2025-06-30'),
      createdBy: pm._id, members: [mike._id, sarah._id]
    },
    {
      name: 'Mobile App v2.0',
      description: 'Native iOS and Android app with offline support and push notifications.',
      status: 'planning', priority: 'medium',
      startDate: new Date('2025-03-01'), endDate: new Date('2025-09-30'),
      createdBy: pm._id, members: [mike._id]
    },
    {
      name: 'Infrastructure Migration',
      description: 'Migrate all services to Kubernetes on AWS EKS.',
      status: 'on_hold', priority: 'critical',
      startDate: new Date('2025-02-01'), endDate: new Date('2025-04-30'),
      createdBy: admin._id, members: [sarah._id]
    },
  ]);

  const [proj1, proj2, proj3] = projects;
  console.log('Created projects');

  // Create tasks
  await Task.insertMany([
    { title: 'Design new homepage wireframes', projectId: proj1._id, assignedTo: sarah._id, createdBy: pm._id, status: 'completed', priority: 'high', dueDate: new Date('2025-02-15'), estimatedHours: 16 },
    { title: 'Implement product catalog API', projectId: proj1._id, assignedTo: mike._id, createdBy: pm._id, status: 'in_progress', priority: 'high', dueDate: new Date('2025-03-30'), estimatedHours: 40 },
    { title: 'Shopping cart functionality', projectId: proj1._id, assignedTo: mike._id, createdBy: pm._id, status: 'todo', priority: 'critical', dueDate: new Date('2025-04-15'), estimatedHours: 24 },
    { title: 'Payment gateway integration', projectId: proj1._id, assignedTo: sarah._id, createdBy: pm._id, status: 'todo', priority: 'critical', dueDate: new Date('2025-05-01'), estimatedHours: 32 },
    { title: 'UI component library setup', projectId: proj1._id, createdBy: pm._id, status: 'completed', priority: 'medium', estimatedHours: 8 },
    { title: 'User authentication flow', projectId: proj2._id, assignedTo: mike._id, createdBy: pm._id, status: 'in_progress', priority: 'high', dueDate: new Date('2025-04-01'), estimatedHours: 20 },
    { title: 'Push notification system', projectId: proj2._id, assignedTo: sarah._id, createdBy: pm._id, status: 'todo', priority: 'medium', dueDate: new Date('2025-05-15'), estimatedHours: 16 },
    { title: 'K8s cluster setup', projectId: proj3._id, assignedTo: sarah._id, createdBy: admin._id, status: 'review', priority: 'critical', dueDate: new Date('2025-03-01'), estimatedHours: 48 },
  ]);

  console.log('Created tasks');
  console.log('\n✅ Seed complete!\n');
  console.log('Demo credentials:');
  console.log('  Admin:   admin@demo.com / demo123');
  console.log('  PM:      pm@demo.com / demo123');
  console.log('  Member:  member@demo.com / demo123');

  if (!skipConnect) {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seed().catch(err => { console.error(err); process.exit(1); });
}

module.exports = seed;
