# 💣 Minesweeper Pro

> Next-generation minesweeper platform with multiplayer, AI coaching, skins, and daily challenges

![Minesweeper Pro](https://img.shields.io/badge/React-18+-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-34d399?style=flat-square&logo=supabase)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## ✨ Features

### 🎮 Game Modes
- **Classic Puzzle**: 3 difficulty levels (9×9, 16×16, 16×30)
- **Blitz Mode**: Timed challenges for speed enthusiasts
- **Daily Challenge**: Global leaderboard with same puzzle for everyone daily
- **First-move protection**: Never lose on your first click

### 🤖 AI Coach
- **Probability Engine**: Real-time mine probability calculations
- **3 Coaching Modes**: Hint, Guide, Solver (toggle with checkbox)
- **Smart Suggestions**: Context-aware recommendations based on board state
- **Learning Tool**: Improve your strategies with AI assistance

### 🌐 Multiplayer
- **Duels**: 1v1 head-to-head races
- **Cooperative Mode**: Team up to solve puzzles together
- **Battle Royale**: Free-for-all multiplayer arena
- **Powered by Supabase Realtime**: Live game synchronization

### 🎨 Customization
- **6 Collectible Skins**:
  - 🎯 Classic (default)
  - 🤖 Cyberpunk (500 coins)
  - 🌌 Cosmos (750 coins)
  - ✨ Cute (600 coins)
  - 🎄 Winter (550 coins)
  - 8️⃣ Pixel (650 coins)

### 📊 Progression System
- **Coin Rewards**: Earn coins from victories
- **Win Tracking**: Track your total wins and streaks
- **Global Leaderboard**: Compete by difficulty level
- **Statistics**: Detailed game history and records
- **Achievements**: Unlock special badges and titles

### 🌙 Themes
- Light mode
- Dark mode
- High contrast mode

### 📱 Mobile First
- Long tap → Flag
- Double tap → Chord (open around number)
- Adaptive field sizing for all screen sizes
- Touch-optimized UI

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- Git
- Supabase account (free tier available)
- Vercel or Netlify account (optional, for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/minesweeper-pro.git
cd minesweeper-pro

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Fill in your environment variables (see below)

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 📋 Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe (optional, for monetization)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Optional: API configuration
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Minesweeper Pro
```

**Never commit `.env.local` to version control!** It's listed in `.gitignore`.

---

## 🗄️ Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Enter project name, database password, and region
4. Wait for initialization (2-3 minutes)

### 2. Run Database Migrations

1. Open **SQL Editor** in Supabase dashboard
2. Copy the SQL from `src/supabase/migrations/001_initial.sql`
3. Paste and execute the entire migration

The migration creates these tables:
- `users` - User profiles
- `games` - Game history
- `multiplayer_rooms` - Active multiplayer sessions
- `leaderboard` - Global rankings
- `skins` - Owned skins per user
- `daily_challenges` - Daily puzzle metadata

### 3. Configure Authentication

**Settings → Authentication:**
- Email confirmation → Enable
- Email templates → Customize (optional)

**Authentication → URL Configuration:**
- Add your domain to "Site URL"
  - Development: `http://localhost:5173`
  - Production: `https://yourdomain.com`
- Add redirect URLs:
  - `http://localhost:5173/auth/callback`
  - `https://yourdomain.com/auth/callback`

### 4. Create Storage Bucket

**Storage → New Bucket:**
- Name: `avatars`
- Public: ✓ (Allow public read access)
- Upload limit: 5 MB

### 5. Enable Realtime

**Database → Realtime:**
- Enable for `multiplayer_rooms` table
- This powers live multiplayer sync

---

## 🌐 Deployment



### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

**Or via Netlify Dashboard:**

1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Connect your repository
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Add environment variables in Site settings
7. Deploy

### Build Configuration

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Linting
npm run lint

# Type checking
npm run type-check
```

---

## 🔐 Authentication

**Auth Flow:**
1. User lands on [adorable-pastelito-b7fb0d.netlify.app/auth](https://adorable-pastelito-b7fb0d.netlify.app/auth)
2. Sign up with email or social login
3. Verify email (confirmation link)
4. Redirected to game dashboard
5. Create profile, choose starting skin

**Session Management:**
- JWT tokens stored in Supabase
- Auto-refresh on token expiry
- Logout clears session

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool (lightning fast ⚡)
- **Zustand** - State management
- **React Router v6** - Routing
- **Tailwind CSS** - Styling

### Backend & Services
- **Supabase** - Auth, PostgreSQL, Realtime, Storage
- **Stripe** (optional) - Payment processing
- **Vercel/Netlify** - Hosting & CI/CD

### Development
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing
- **TypeScript** - Type checking

---

## 📁 Project Structure

```
minesweeper-pro/
├── src/
│   ├── components/          # Reusable components
│   │   ├── GameBoard.tsx    # Main game grid
│   │   ├── Leaderboard.tsx
│   │   └── ...
│   ├── pages/               # Page components
│   │   ├── Home.tsx
│   │   ├── Game.tsx
│   │   ├── Multiplayer.tsx
│   │   └── Auth.tsx
│   ├── stores/              # Zustand stores
│   │   ├── gameStore.ts
│   │   ├── userStore.ts
│   │   └── multiplayerStore.ts
│   ├── supabase/
│   │   ├── client.ts        # Supabase initialization
│   │   └── migrations/      # SQL migrations
│   ├── types/               # TypeScript types
│   ├── hooks/               # Custom hooks
│   ├── utils/               # Utilities & helpers
│   └── App.tsx              # Root component
├── public/                  # Static assets
├── .env.example             # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🎮 How to Play

### Basic Rules
- Click to reveal cells
- Numbers show mines in adjacent cells
- Flag suspected mines (long tap on mobile)
- Clear the board without hitting mines

### Difficulty Levels
| Level | Grid | Mines | Avg. Time |
|-------|------|-------|-----------|
| Beginner | 9×9 | 10 | 1-2 min |
| Intermediate | 16×16 | 40 | 5-10 min |
| Expert | 16×30 | 99 | 15+ min |

### Multiplayer Tips
- **Duels**: Fastest time wins
- **Coop**: Coordinate moves with teammate
- **Battle Royale**: Last player standing wins

---

## 🤝 Contributing

Contributions welcome! Follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow ESLint configuration
- Format with Prettier before committing
- Write meaningful commit messages
- Add TypeScript types for all new functions

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support & Troubleshooting

### Common Issues

**"VITE_SUPABASE_URL is undefined"**
- Check `.env.local` exists in project root
- Verify environment variable names are correct
- Restart development server after adding variables

**"Supabase connection failed"**
- Verify Supabase project is running
- Check API key is valid and not rotated
- Ensure database migrations completed
- Check CORS settings in Supabase

**"Multiplayer not syncing"**
- Verify Realtime is enabled for `multiplayer_rooms`
- Check network connection
- Refresh browser tab
- Ensure you're using HTTPS in production

**"Skins not showing"**
- Clear browser cache
- Verify storage bucket `avatars` exists and is public
- Check skin images are uploaded

### Debug Mode

Enable debug logging:
```typescript
// In src/main.tsx
localStorage.setItem('DEBUG', '1');
```

Check browser console for detailed logs.

---

## 📞 Contact & Links

- **Live App**: [adorable-pastelito-b7fb0d.netlify.app](https://adorable-pastelito-b7fb0d.netlify.app)
- **Auth Login**: [adorable-pastelito-b7fb0d.netlify.app/auth](https://adorable-pastelito-b7fb0d.netlify.app/auth)
- **Issues**: [GitHub Issues](https://github.com/yourusername/minesweeper-pro/issues)
- **Email**: support@minesweeperpro.com

---



## 📊 Analytics & Monitoring

Connected services:
- **Sentry** - Error tracking
- **Supabase Analytics** - User metrics
- **Google Analytics** - Traffic insights

Privacy-first approach: No personal data beyond gameplay stats.

---

**Made with ❤️ by the Minesweeper Pro Team**

⭐ If you like this project, please star it on GitHub!
