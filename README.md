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
   - Visit `http://localhost:3000/init-courses` once.
6. **Use the app**
   - Go to `http://localhost:3000/register` to create a student account.
   - Login at `/login`.
   - Manage courses at `/courses`.

### Deployment on Render

- Repo should contain `Course_Reg` directory.
- Render settings:
  - **Build command**: `npm install`
  - **Start command**: `npm start`
  - Add environment variables: `MONGODB_URI`, `SESSION_SECRET`, `NODE_ENV=production`, `PORT` (Render sets this automatically).
- `render.yaml` in the root of `Course_Reg` is provided to describe the service.


