# 📚 Flashcard App

A simple, beautiful flashcard app to help you actually remember things.

Built because Quizlet got too expensive and I needed to study.

---

## ✨ What it does

- **Create flashcard sets** with text and images
- **Multiple study modes:**
  - 🎯 **Learn** – Multiple choice with smart card scheduling
  - ✍️ **Write** – Type your answers (typos forgiven)
  - 📝 **Test** – Timed quizzes to prove you know your stuff
- **Flip it around** – Answer with the term OR the definition
- **Track your progress** – See stats on how you're doing
- **Share sets** – Make sets public for others to copy
- **Confetti** – Because you deserve it when you get 100% 🎉

---

## 🛠 Tech Stack

| What | Why |
|------|-----|
| React | Frontend that actually works |
| Express.js | Simple backend API |
| PostgreSQL | Stores all your flashcards |
| Google OAuth | Easy sign-in, no passwords to forget |

---

## 🚀 Running it locally

### 1. Clone it

```bash
git clone https://github.com/YOUR_USERNAME/flashcard_app.git
cd flashcard_app
```

### 2. Set up the backend

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

### 3. Set up the frontend

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

You're in! 🎉

---

## 📦 Database

The app creates tables automatically on first run. But if you want to set it up manually:

```sql
CREATE DATABASE flashcard_db;
```

That's it. The backend handles the rest.

---

## 🌐 Deploying

**Backend:** Railway, Render, or any Node.js host  
**Frontend:** Vercel, Netlify, or anywhere that serves static files  
**Database:** Railway Postgres, Supabase, or AWS RDS

Don't forget to update your environment variables for production!

---

## 📁 Project Structure

```
flashcard_app/
├── backend/
│   └── src/
│       ├── routes/      # API endpoints
│       ├── middleware/  # Auth stuff
│       └── db/          # Database setup
├── frontend/
│   └── src/
│       ├── components/  # React components
│       ├── context/     # Auth context
│       └── api/         # API client
└── README.md            # You are here
```

---

## 🤔 Why I built this

I wanted a flashcard app that:
- Doesn't charge $8/month
- Looks nice
- Actually helps me learn
- I could customize

So I made one.

---

## 📝 License

Do whatever you want with it. Seriously.

---

## 🙋 Questions?

Open an issue or just fork it and figure it out. You got this.

---

*Made with late nights and too much coffee ☕*
