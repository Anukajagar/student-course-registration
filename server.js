const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');

dotenv.config();

const User = require('./models/User');
const Course = require('./models/Course');

const app = express();

// Config
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/course_registration';
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  'your-super-secret-session-key-change-this-in-production-12345';

// MongoDB connection
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Helper: credit limits by semester
const CREDIT_LIMITS = {
  1: 20,
  2: 20,
  3: 22,
  4: 22,
  5: 24,
  6: 24,
  7: 18,
  8: 18,
};

// Middleware: expose session user to views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user;
  next();
});

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// Routes
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/courses');
  }
  return res.redirect('/login');
});

// Auth routes
const bcrypt = require('bcryptjs');

app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/courses');
  }
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    req.session.user = {
      id: user._id,
      name: user.name,
      semester: user.semester,
    };

    res.redirect('/courses');
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { error: 'Something went wrong. Please try again.' });
  }
});

app.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/courses');
  }
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  try {
    const { name, email, password, studentId, semester } = req.body;

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.render('register', { error: 'Email already in use' });
    }

    const existingStudent = await User.findOne({ studentId });
    if (existingStudent) {
      return res.render('register', { error: 'Student ID already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      studentId,
      semester: Math.min(8, Math.max(1, Number(semester) || 1)),
    });

    req.session.user = {
      id: user._id,
      name: user.name,
      semester: user.semester,
    };

    res.redirect('/courses');
  } catch (err) {
    console.error('Register error:', err);
    res.render('register', { error: 'Something went wrong. Please try again.' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Courses page
app.get('/courses', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id).populate('registeredCourses');
    if (!user) {
      req.session.destroy(() => res.redirect('/login'));
      return;
    }

    const semester = user.semester || 1;
    const creditLimit = CREDIT_LIMITS[semester] || 20;

    const allCourses = await Course.find().sort({ credits: -1 });
    const registeredIds = new Set(user.registeredCourses.map((c) => String(c._id)));

    const registeredCourses = allCourses.filter((c) => registeredIds.has(String(c._id)));
    const availableCourses = allCourses.filter((c) => !registeredIds.has(String(c._id)));

    const totalCredits = registeredCourses.reduce((sum, c) => sum + c.credits, 0);
    const remainingCredits = creditLimit - totalCredits;

    res.render('courses', {
      userName: user.name,
      semester,
      creditLimit,
      totalCredits,
      remainingCredits,
      registeredCourses,
      availableCourses,
    });
  } catch (err) {
    console.error('/courses error:', err);
    res.status(500).send('An error occurred while loading courses.');
  }
});

// Helper: get credit limit
function getCreditLimit(semester) {
  return CREDIT_LIMITS[semester] || 20;
}

// Register course
app.post('/register-course/:courseId', requireAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const user = await User.findById(req.session.user.id).populate('registeredCourses');
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    if (user.registeredCourses.some((c) => String(c._id) === String(courseId))) {
      return res.status(400).json({ success: false, message: 'Already registered for this course' });
    }

    const creditLimit = getCreditLimit(user.semester);
    const totalCredits = user.registeredCourses.reduce((sum, c) => sum + c.credits, 0);
    const newTotal = totalCredits + course.credits;

    if (newTotal > creditLimit) {
      return res.status(400).json({
        success: false,
        message: `Credit limit exceeded! Maximum ${creditLimit} credits allowed for Semester ${user.semester}. Current: ${totalCredits}, Adding: ${course.credits}`,
      });
    }

    user.registeredCourses.push(course._id);
    await user.save();

    return res.json({ success: true, message: 'Course registered successfully' });
  } catch (err) {
    console.error('register-course error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// Unregister course
app.post('/unregister-course/:courseId', requireAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const user = await User.findById(req.session.user.id);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    user.registeredCourses = user.registeredCourses.filter(
      (id) => String(id) !== String(courseId)
    );
    await user.save();

    return res.json({ success: true, message: 'Course unregistered successfully' });
  } catch (err) {
    console.error('unregister-course error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// Update semester
app.post('/update-semester', requireAuth, async (req, res) => {
  try {
    let { semester } = req.body;
    semester = Number(semester);
    if (!semester || semester < 1 || semester > 8) {
      return res.status(400).json({ success: false, message: 'Invalid semester value' });
    }

    const user = await User.findById(req.session.user.id).populate('registeredCourses');
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const oldSemester = user.semester;
    user.semester = semester;
    await user.save();

    req.session.user.semester = semester;

    const creditLimit = getCreditLimit(semester);
    const totalCredits = user.registeredCourses.reduce((sum, c) => sum + c.credits, 0);
    const remainingCredits = creditLimit - totalCredits;

    res.json({
      success: true,
      message: `Semester updated from ${oldSemester} to ${semester}`,
      data: {
        semester,
        creditLimit,
        totalCredits,
        remainingCredits,
      },
    });
  } catch (err) {
    console.error('update-semester error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// Init courses
app.get('/init-courses', async (req, res) => {
  try {
    const count = await Course.countDocuments();
    if (count > 0) {
      return res.send('Courses already initialized.');
    }

    const courses = [
      // Theory courses
      { code: 'CS101', name: 'Data Structures and Algorithms', credits: 4, type: 'Theory', semester: 3 },
      { code: 'CS102', name: 'Object-Oriented Programming', credits: 3, type: 'Theory', semester: 2 },
      { code: 'CS103', name: 'Database Management Systems', credits: 3, type: 'Theory', semester: 4 },
      { code: 'CS104', name: 'Computer Networks', credits: 3, type: 'Theory', semester: 5 },
      { code: 'CS105', name: 'Software Engineering', credits: 3, type: 'Theory', semester: 6 },
      { code: 'EE201', name: 'Digital Electronics', credits: 4, type: 'Theory', semester: 3 },
      { code: 'EE202', name: 'Signals and Systems', credits: 4, type: 'Theory', semester: 4 },
      { code: 'ME301', name: 'Thermodynamics', credits: 3, type: 'Theory', semester: 5 },
      { code: 'ME302', name: 'Engineering Mechanics', credits: 4, type: 'Theory', semester: 2 },
      { code: 'CE401', name: 'Structural Analysis', credits: 3, type: 'Theory', semester: 6 },
      // Lab courses
      { code: 'CS151', name: 'Programming Lab', credits: 2, type: 'Lab', semester: 2 },
      { code: 'CS152', name: 'Database Lab', credits: 2, type: 'Lab', semester: 4 },
      { code: 'CS153', name: 'Networks Lab', credits: 2, type: 'Lab', semester: 5 },
      { code: 'EE251', name: 'Electronics Lab', credits: 2, type: 'Lab', semester: 3 },
      { code: 'ME351', name: 'Mechanical Workshop', credits: 2, type: 'Lab', semester: 5 },
    ];

    await Course.insertMany(courses);
    res.send('Courses initialized successfully.');
  } catch (err) {
    console.error('init-courses error:', err);
    res.status(500).send('Failed to initialize courses.');
  }
});

// 404
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


