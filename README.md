# 🏋️ TrainLog

A modern workout tracking application built with React, TypeScript, Firebase, and Vite.

![TrainLog Version](https://img.shields.io/badge/version-1.0.0-green)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Firebase](https://img.shields.io/badge/Firebase-10-orange)

## ✨ Features

### 🎯 Core Features
- ✅ **Workout Management** - Create, edit, and organize your training routines
- ✅ **Exercise Library** - 60+ pre-loaded exercises with search and filters
- ✅ **Exercise Images** - Real exercise images via FREE Wger API (no API key needed!)
- ✅ **Progress Tracking** - Visualize your weight progression with interactive charts
- ✅ **Workout Templates** - Pre-built workout splits (Push/Pull/Legs, Upper/Lower, Full Body)
- ✅ **Training Logs** - Automatic logging of completed exercises
- ✅ **Day-based Training** - Organize workouts by day of the week

### 🎨 UI/UX
- ✅ **Responsive Design** - Works seamlessly on mobile and desktop
- ✅ **Liquid Glass Effect** - Modern glassmorphism design elements
- ✅ **Dark Mode Ready** - Prepared for dark theme implementation
- ✅ **Password Visibility Toggle** - User-friendly authentication forms
- ✅ **Loading States** - Skeleton loaders for better UX

### 📊 Analytics
- ✅ **Weight Progression Charts** - Track your strength gains over time
- ✅ **Personal Records (PRs)** - Highlight your best lifts
- ✅ **Recent Sessions** - View your latest workout logs
- ✅ **Stats Cards** - Quick overview of total sessions and PRs

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/trainlog.git
   cd trainlog
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Firebase config:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   # ... other Firebase config
   ```

4. **Setup Firebase**
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Deploy the security rules from `firestore.rules`

5. **Seed workout templates (optional)**
   ```bash
   pnpm seed-templates your_email@example.com your_password
   ```

6. **Start development server**
   ```bash
   pnpm dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:5173`

## 📚 Documentation

- [Wger API Integration](./docs/WGER_API.md) - How exercise images work (FREE!)
- [Future Improvements](./docs/FUTURE_IMPROVEMENTS.md) - Planned features and enhancements
- [Firestore Rules Update](./FIRESTORE_RULES_UPDATE.md) - Security rules documentation

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Backend**: Firebase (Auth + Firestore)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Styling**: Tailwind CSS
- **API**: Wger Exercise API (free, open-source)

## 📦 Project Structure

```
trainlog/
├── src/
│   ├── components/     # React components
│   ├── data/          # Firebase functions and data fetching
│   ├── pages/         # Page components
│   ├── layouts/       # Layout components
│   └── assets/        # Images and static files
├── scripts/           # Utility scripts (seeding, etc.)
├── docs/             # Documentation
└── public/           # Public assets
```

## 🎯 Key Pages

- `/` - Home page with app introduction
- `/login` - User authentication
- `/register` - New user registration
- `/training` - Main workout tracking interface
- `/profile` - User profile and workout management
- `/progress` - Analytics and progress charts
- `/log` - Workout history

## 🔐 Firebase Security Rules

The app uses comprehensive Firestore security rules to protect user data:
- Users can only read/write their own data
- Admins have special permissions
- Templates are read-only for all users
- Exercise subcollections inherit parent permissions

See `firestore.rules` for details.

## 🧪 Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm seed-templates <email> <password>` - Seed workout templates

## 🌟 Wger API Integration

TrainLog uses the free **Wger Exercise API** to provide:
- Real exercise images (no API key needed!)
- 1000+ exercises with photos
- Exercise videos
- Completely free and open-source

See [Wger API documentation](./docs/WGER_API.md) for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Wger](https://wger.de/) - Free, open-source exercise API with images
- [Recharts](https://recharts.org/) - Chart library
- [Lucide](https://lucide.dev/) - Icon library
- [Firebase](https://firebase.google.com/) - Backend services

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

Built with ❤️ using React + TypeScript + Vite
