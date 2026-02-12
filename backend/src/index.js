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
app.use(cors())
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
