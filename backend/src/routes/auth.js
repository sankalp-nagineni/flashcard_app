import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import { query, queryOne, execute } from '../db/init.js'
import { generateToken, authenticateToken } from '../middleware/auth.js'

const router = Router()

// Google Sign-In
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({ error: 'Google credential required' })
    }

    // Decode the JWT token from Google (the payload is base64 encoded)
    const parts = credential.split('.')
    if (parts.length !== 3) {
      return res.status(400).json({ error: 'Invalid credential format' })
    }

    // Decode payload (middle part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    
    const { sub: googleId, email, name, picture } = payload

    if (!googleId || !email) {
      return res.status(400).json({ error: 'Invalid Google token' })
    }

    // Check if user exists
    let user = await queryOne(
      'SELECT * FROM users WHERE google_id = $1 OR email = $2',
      [googleId, email]
    )

    if (user) {
      // Update existing user with Google info if needed
      if (!user.google_id) {
        await execute(
          'UPDATE users SET google_id = $1, name = $2, picture = $3 WHERE id = $4',
          [googleId, name || user.name, picture || null, user.id]
        )
      }
    } else {
      // Create new user
      const id = uuid()
      await execute(
        'INSERT INTO users (id, email, google_id, name, picture) VALUES ($1, $2, $3, $4, $5)',
        [id, email, googleId, name || null, picture || null]
      )
      user = { id, email, google_id: googleId, name, picture }
    }

    // Get fresh user data
    user = await queryOne(
      'SELECT id, email, name, picture, created_at FROM users WHERE google_id = $1',
      [googleId]
    )

    const token = generateToken(user)
    res.json({ user, token })
  } catch (err) {
    console.error('Google auth error:', err)
    res.status(500).json({ error: 'Authentication failed' })
  }
})

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await queryOne(
      'SELECT id, email, name, picture, created_at FROM users WHERE id = $1',
      [req.user.id]
    )
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

export default router
