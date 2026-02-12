import express from 'express'
import cors from 'cors'
import { initDb } from './db/init.js'
import authRoutes from './routes/auth.js'
import setsRoutes from './routes/sets.js'
import cardsRoutes from './routes/cards.js'
import studyRoutes from './routes/study.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    // In production, also allow any railway.app subdomain
    if (origin.endsWith('.railway.app')) {
      return callback(null, true)
    }
    return callback(null, true) // Allow all for now
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '10mb' }))  // Increased limit for image uploads

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/sets', setsRoutes)
app.use('/api/cards', cardsRoutes)
app.use('/api/study', studyRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

// Initialize database and start server
async function start() {
  await initDb()
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start().catch(console.error)
