// Quick script to view MongoDB data
// Run with: node view-mongo-data.js

const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/course_registration';

async function viewData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // View all users
    const users = await User.find().select('-password');
    console.log('=== USERS ===');
    console.log(`Total users: ${users.length}\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Student ID: ${user.studentId}, Semester: ${user.semester}`);
      console.log(`   Registered Courses: ${user.registeredCourses.length}`);
      console.log('');
    });

    // View all courses
    const courses = await Course.find();
    console.log('=== COURSES ===');
    console.log(`Total courses: ${courses.length}\n`);
    courses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.code} - ${course.name}`);
      console.log(`   Credits: ${course.credits}, Type: ${course.type}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

viewData();

