# Flashcard App

A flashcard app I built because Quizlet started charging too much.

## What it does

- Create flashcard sets with text and images
- Multiple study modes:
  - **Learn** – multiple choice with smart card scheduling
  - **Write** – type your answers (it forgives typos)
  - **Test** – timed quizzes
- Answer with the term or the definition
- Track your progress over time
- Share sets publicly so others can copy them
- Confetti when you get 100% (because why not)

## Tech stack

| What | Why |
|------|-----|
| React | Frontend |
| Express.js | Backend API |
| PostgreSQL | Database |
| Google OAuth | Sign-in without passwords |

## Running it locally

### 1. Clone it

```bash
git clone https://github.com/YOUR_USERNAME/flashcard_app.git
cd flashcard_app
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_NAME=flashcard_db
JWT_SECRET=any-random-string-here
GOOGLE_CLIENT_ID=your-google-client-id
```

Start it:

```bash
npm start
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

Start it:

```bash
npm run dev
```

### 4. Open http://localhost:5173

Should be good to go.

## Database

Tables get created automatically on first run. If you want to set it up manually:

```sql
CREATE DATABASE flashcard_db;
```

The backend handles the rest.

## Deploying

**Backend:** Railway, Render, or any Node.js host  
**Frontend:** Vercel, Netlify, or anywhere that serves static files  
**Database:** Railway Postgres, Supabase, or AWS RDS

Update your environment variables for production.

## Project structure

```
flashcard_app/
├── backend/
│   └── src/
│       ├── routes/      # API endpoints
│       ├── middleware/  # Auth
│       └── db/          # Database setup
├── frontend/
│   └── src/
│       ├── components/  # React components
│       ├── context/     # Auth context
│       └── api/         # API client
└── README.md
```

## Why I built this

I wanted a flashcard app that:
- Doesn't cost money
- Looks decent
- Actually helps me learn
- I could change however I want

So I made one.

## License

MIT. Do whatever you want with it.

## Questions?

Open an issue or fork it.
