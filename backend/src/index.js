import express from 'express'
import cors from 'cors'
import { initDb } from './db/init.js'
import authRoutes from './routes/auth.js'
import setsRoutes from './routes/sets.js'
import cardsRoutes from './routes/cards.js'
import studyRoutes from './routes/study.js'

const app = express()
const PORT = parseInt(process.env.PORT, 10) || 3001

console.log('Starting server...')
console.log('PORT from env:', process.env.PORT)
console.log('Using PORT:', PORT)

// Middleware - CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://satisfied-warmth-production.up.railway.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(express.json({ limit: '10mb' }))  // Increased limit for image uploads

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/sets', setsRoutes)
app.use('/api/cards', cardsRoutes)
app.use('/api/study', studyRoutes)

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Flashcard API is running', version: '1.0.0' })
})

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
  try {
    console.log('Initializing database...')
    await initDb()
    console.log('Database initialized, starting HTTP server...')
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is listening on 0.0.0.0:${PORT}`)
      console.log('Server ready to accept connections')
    })
    
    server.on('error', (err) => {
      console.error('Server error:', err)
    })
  } catch (err) {
    console.error('Startup error:', err)
    process.exit(1)
  }
}

start()
