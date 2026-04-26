# Persevex Resume Maker

A modern, full-stack web application that empowers users to create, customize, and download professional resumes using 100+ beautifully designed templates.

## 🎯 Features

- **100+ Resume Templates**: Professionally designed templates across multiple styles
  - Two-column layouts with sidebars
  - Single-column modern layouts
  - Timeline-based chronological designs
  - Centered minimalist styles

- **Interactive Resume Builder**: Intuitive wizard-based interface for filling in resume information
  - Personal information form
  - Work experience management
  - Education tracking
  - Skills and certifications
  - Project portfolio
  - Customizable sections

- **Live Preview**: Real-time preview as you customize your resume

- **Template Customization**: 
  - Adjust colors and themes
  - Modify spacing and layout
  - Control section visibility
  - Choose typography options

- **Export Capabilities**:
  - Download as PDF
  - Generate high-quality images

- **Cloud Integration**: 
  - Supabase authentication & database
  - Resume data persistence
  - Secure PostgreSQL backend

- **Job Board Integration**: Browse and apply to job listings

- **Master Profile**: Create and manage multiple resume profiles

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool for lightning-fast development
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Zustand** - State management
- **Framer Motion** - Animations
- **Chart.js** - Data visualization
- **html2canvas & jsPDF** - PDF and image generation

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Supabase** - PostgreSQL database with RLS
- **node-cron** - Task scheduling

### Additional Libraries
- **Mammoth** - DOCX file parsing
- **Papa Parse** - CSV parsing
- **PDF.js** - PDF manipulation
- **Lucide React** - Icon library
- **Radix UI** - Headless component primitives

## 📁 Project Structure

```
ProjectResume/
├── client/                          # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── build/              # Resume builder components
│   │   │   ├── resume/             # Resume rendering components
│   │   │   ├── templates/          # Template rendering logic
│   │   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Navbar.jsx          # Navigation bar
│   │   │   └── SplashLoader.jsx    # Loading animation
│   │   ├── pages/                  # Page components
│   │   │   ├── Build.jsx           # Resume builder page
│   │   │   ├── Home.jsx            # Landing page
│   │   │   ├── Templates.jsx       # Template selection page
│   │   │   ├── StudentDashboard.jsx # User dashboard
│   │   │   ├── MasterProfile.jsx   # Profile management
│   │   │   ├── JobBoard.jsx        # Job listings page
│   │   │   ├── UploadResume.jsx    # Resume upload page
│   │   │   ├── SignIn.jsx          # Authentication
│   │   │   └── AdminDashboard.jsx  # Admin panel
│   │   ├── data/
│   │   │   └── templates.js        # Template definitions
│   │   ├── lib/
│   │   │   ├── utils.js            # Utility functions
│   │   │   └── userIdentity.js     # User identification
│   │   ├── store/
│   │   │   └── useStore.js         # Zustand state management
│   │   ├── App.jsx                 # Main app component
│   │   ├── main.jsx                # Entry point
│   │   ├── supabase.js             # Supabase configuration
│   │   └── App.css, index.css       # Styling
│   ├── vite.config.js              # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   ├── tsconfig.json               # TypeScript configuration
│   ├── eslint.config.js            # ESLint rules
│   ├── postcss.config.js           # PostCSS configuration
│   └── package.json                # Frontend dependencies
│
├── server/                          # Node.js/Express backend
│   ├── index.js                    # Server entry point
│   └── package.json                # Backend dependencies
│
├── migrations/                      # SQL migrations
├── scripts/
│   └── maintenance/                 # One-off admin/diagnostic scripts
│       ├── create_admin.js
│       ├── get_admin.js
│       ├── final_admin_check.js
│       └── get_admin_direct.js
│
├── DB_MIGRATIONS/                   # Additional SQL migrations
├── docs/                            # Project documentation
│   ├── PROJECT_STRUCTURE.md         # Canonical structure guide
│   ├── DEVELOPER_QUICK_START.md
│   ├── INTEGRATION_GUIDE.md
│   ├── SYSTEM_ARCHITECTURE.md
│   └── TESTING_GUIDE.md
│
└── README.md                        # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account (PostgreSQL database)
- Network access to Supabase API

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Persevex Resume Maker"
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../server
   npm install
   ```

4. **Configure Environment Variables**

   Environment files are already configured with Supabase credentials. Copy them to use:

   **client/.env**
   ```bash
   cp client/.env.example client/.env
   ```

   Variables will be:
   ```
   VITE_SUPABASE_URL=https://nmpikqrlhkcamzarcjka.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=http://localhost:5000
   VITE_APP_MODE=development
   ```

   **server/.env**
   ```bash
   cp server/.env.example server/.env
   ```

   Variables will be:
   ```
   SUPABASE_URL=https://nmpikqrlhkcamzarcjka.supabase.co
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   SUPABASE_ANON_KEY=your_supabase_anon_key
   PORT=5000
   NODE_ENV=development
   ```

   See `.env.example` files in each directory for all available configuration options.

### Running the Application

**Development Mode**

Terminal 1 - Frontend (from client directory):
```bash
npm run dev
```
Frontend will be available at `http://localhost:5173`

Terminal 2 - Backend (from server directory):
```bash
npm run dev
```
Backend will be available at `http://localhost:5000`

**Production Build**

Frontend:
```bash
cd client
npm run build
```

## 🚀 Deployment Guide

## 🧰 Maintenance Scripts

Manual admin/diagnostic scripts are in `scripts/maintenance/` and are intentionally separated from runtime code.

```bash
node scripts/maintenance/create_admin.js
```

### Railway Deployment

This project is optimized for [Railway](https://railway.app) deployment with automatic build and deployment pipelines.

**Deployment Files:**
- `railway.json` - Railway-specific configuration
- `Procfile` - Process types for build and web servers
- `.nvmrc` - Node.js version specification (18.17.0)
- `package.json` - Root package.json with workspace configuration

**Build Process (Automatic on Railway):**
1. Railway detects `package.json` and `railway.json`
2. Installs Node.js (18.17.0)
3. Builds frontend: `npm --prefix client run build`
4. Installs backend dependencies: `npm --prefix server install`
5. Starts backend server: `npm --prefix server start`

**Environment Variables (Set in Railway Dashboard):**
```
VITE_SUPABASE_URL=https://nmpikqrlhkcamzarcjka.supabase.co
VITE_SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_URL=https://nmpikqrlhkcamzarcjka.supabase.co
SUPABASE_SERVICE_KEY=<your_service_key>
SUPABASE_ANON_KEY=<your_anon_key>
PORT=8000
NODE_ENV=production
```

**Deploy Steps:**
1. Push code to GitHub/GitLab
2. Connect Railway to your repository
3. Set environment variables in Railway Dashboard
4. Railway automatically builds and deploys on push

### Local Full Stack Build

To build the full stack locally:
```bash
bash build.sh
```

This will:
- Install frontend dependencies
- Build React frontend
- Install backend dependencies
- Prepare app for production

### Other Platform Deployments

**Vercel (Frontend Only):**
- Deploy `client` directory to Vercel
- Configure Node.js backend separately (Railway, Heroku, etc.)

**Heroku:**
- Uses `Procfile` for configuration
- Automatically detects and deploys Node.js apps
- Set environment variables in Heroku Dashboard

**Docker Deployment:**
Create a `Dockerfile` at project root with:
```dockerfile
FROM node:18.17.0
WORKDIR /app
COPY . .
RUN npm --prefix client install && npm --prefix client run build
RUN npm --prefix server install
EXPOSE 5000
CMD ["npm", "--prefix", "server", "start"]
```

## 📝 Available Scripts

### Root Scripts (Workspace)
- `npm install-all` - Install dependencies for all workspaces
- `npm run build` - Build frontend for production
- `npm start` - Start backend server (production)
- `npm run build:frontend` - Build frontend only
- `npm run start:frontend` - Start frontend dev server
- `npm run start:backend` - Start backend dev server

### Client Scripts
- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality

### Server Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with file watching

## 🎨 Template System

The application supports 100+ resume templates organized by layout type:

- **Two-Column Layouts**: Professional sidebar designs ideal for experienced professionals
- **Single-Column Layouts**: Modern, minimalist designs for clean presentations
- **Timeline Layouts**: Chronological designs emphasizing career progression
- **Centered Layouts**: Balanced designs with centered content

Each template can be customized with:
- Color schemes
- Font selections
- Section visibility
- Spacing adjustments
- Layout variations

## 🔐 Authentication

The application uses Supabase PostgreSQL database with custom authentication:
- Email/password authentication (students and admins)
- Account expiration management for time-limited access
- Secure session management with localStorage
- User profile persistence in PostgreSQL
- Two user roles: `student` and `admin`

**Auth Service Methods** (from `supabase.js`):
- `auth.signIn(emailOrId, password)` - Authenticate users
- `auth.signOut()` - Clear session
- `auth.signUpStudent(email, password, name)` - Register new students
- `auth.getSession()` - Retrieve current session from storage

## 💾 Data Management

**Supabase PostgreSQL Database:**
- `students` - Student user accounts with email, password, and 2-month expiration tracking
- `admins` - Administrator accounts with email and password
- `resumes` - Resume documents with full data (JSONB) and customization options
- `resum` - Legacy table for data migration purposes

**Resume Data Structure:**
- User ID reference (FK to students table)
- Complete resume data (JSON format)
- Customization options (colors, fonts, spacing)
- Template selection (which template is used)
- Optional scoring system
- Timestamps (created_at, updated_at)

**Backend API** (from `server/index.js`):
- `GET /api/resumes/:userId` - Fetch all user resumes
- `POST /api/resumes` - Create new resume
- `PUT /api/resumes/:resumeId` - Update resume
- `DELETE /api/resumes/:resumeId` - Delete resume
- `GET /api/users/:userId` - Get user profile

## 📤 Export Features

- **PDF Export**: High-quality PDF downloads using jsPDF and html2canvas
- **Image Export**: Generate PNG/JPG versions of resumes
- **Import**: Support for uploading existing resumes from DOCX and PDF files

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request.

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues, questions, or feature requests, please create an issue in the repository or contact the development team.

## 🎓 Educational Resources

The codebase includes:
- Comprehensive component structure
- Modern React patterns and best practices
- State management with Zustand
- Responsive design with Tailwind CSS
- Advanced PDF generation techniques
- Full-stack JavaScript development examples

---

**Happy Resume Building! 🚀**
