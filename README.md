## Student Course Registration System

Node.js + Express + MongoDB application for managing student course registrations with semester-based credit limits.

### Features

- **Authentication**: Register, login, logout with hashed passwords (bcryptjs) and express-session.
- **Semester system**: 8 semesters with configurable credit limits and live updates.
- **Course management**: 10 theory + 5 lab courses, sorted by credits (descending).
- **Registration rules**: Prevents credit limit overflow with clear error messages.
- **UI/UX**: Modern, gradient-based design with responsive layout and subtle animations.
- **AJAX interactions**: Register/unregister courses and update semester without full form posts.

### Getting started (local)

1. **Install dependencies**
   ```bash
   cd Course_Reg
   npm install
   ```
2. **Configure environment**
   - Create a `.env` file in `Course_Reg` with:
     ```env
     MONGODB_URI=mongodb://localhost:27017/course_registration
     SESSION_SECRET=your-super-secret-session-key-change-this-in-production-12345
     PORT=3000
     ```
3. **Run MongoDB**
   - Start your local MongoDB server or update `MONGODB_URI` to a MongoDB Atlas URI.
4. **Start the server**
   ```bash
   npm run dev
   ```
5. **Initialize courses**
   - Visit `http://localhost:3001/init-courses` once.
6. **Use the app**
   - Go to `http://localhost:3001/register` to create a student account.
   - Login at `/login`.
   - Manage courses at `/courses`.

### Docker Deployment

**For MongoDB Atlas Users:**

1. **Get your MongoDB Atlas connection string**
   - Go to MongoDB Atlas dashboard
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/...`)
   - Replace `<password>` with your actual password
   - Add database name: `/course_registration` at the end (before `?`)

2. **Create a `.env` file in `Course_Reg` directory**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/course_registration?retryWrites=true&w=majority
   SESSION_SECRET=your-super-secret-session-key-change-this-in-production-12345
   PORT=3001
   ```

3. **Start with Docker Compose**
   ```bash
   cd Course_Reg
   docker-compose up --build
   ```
   This will start the Node.js app and connect to your MongoDB Atlas database.

2. **Using Docker only (without docker-compose)**
   
   **For PowerShell (Windows):**
   ```powershell
   # Build the image
   docker build -t course-reg-app .
   
   # Run the container with MongoDB Atlas
   docker run -p 3001:3001 `
     -e MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/course_registration?retryWrites=true&w=majority" `
     -e SESSION_SECRET="your-super-secret-session-key-change-this-in-production-12345" `
     -e NODE_ENV=production `
     -e PORT=3001 `
     course-reg-app
   ```
   
   **For Bash/Linux/Mac:**
   ```bash
   # Build the image
   docker build -t course-reg-app .
   
   # Run the container with MongoDB Atlas
   docker run -p 3001:3001 \
     -e MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/course_registration?retryWrites=true&w=majority" \
     -e SESSION_SECRET="your-super-secret-session-key-change-this-in-production-12345" \
     -e NODE_ENV=production \
     -e PORT=3001 \
     course-reg-app
   ```
   
   **Note**: Replace `username:password@cluster.mongodb.net` with your actual MongoDB Atlas connection string.

3. **Access the application**
   - Visit `http://localhost:3001/init-courses` once to initialize courses.
   - Go to `http://localhost:3001/register` to create a student account.
   - Login at `/login`.
   - Manage courses at `/courses`.

**Note**: The Docker setup now uses MongoDB Atlas. Make sure your Atlas cluster allows connections from anywhere (0.0.0.0/0) in Network Access, or add your IP address.

4. **View MongoDB Data in Atlas**
   - Go to MongoDB Atlas dashboard
   - Click on your cluster
   - Click "Browse Collections"
   - Select database: `course_registration`
   - View collections: `users` and `courses`
   
   **Or use MongoDB Compass:**
   - Download from https://www.mongodb.com/try/download/compass
   - Connect using your Atlas connection string
   - Select database: `course_registration`
   - View collections: `users` and `courses`

### Deployment on Render

- Repo should contain `Course_Reg` directory.
- Render settings:
  - **Build command**: `npm install`
  - **Start command**: `npm start`
  - Add environment variables: `MONGODB_URI`, `SESSION_SECRET`, `NODE_ENV=production`, `PORT` (Render sets this automatically).
- `render.yaml` in the root of `Course_Reg` is provided to describe the service.


