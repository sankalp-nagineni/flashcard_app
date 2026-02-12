import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { query, queryOne, execute } from '../db/init.js'
import { authenticateToken, optionalAuth } from '../middleware/auth.js'

const router = Router()

// ============ PUBLIC ROUTES (no auth required) ============

// Get all public sets
router.get('/public', async (req, res) => {
  try {
    const search = req.query.search || ''
    
    let sets
    if (search) {
      sets = await query(`
        SELECT s.*, u.name as author_name, u.picture as author_picture,
          (SELECT COUNT(*) FROM cards c WHERE c.set_id = s.id) as card_count
        FROM sets s
        JOIN users u ON s.user_id = u.id
        WHERE s.is_public = TRUE 
          AND (LOWER(s.name) LIKE LOWER($1) OR LOWER(s.description) LIKE LOWER($1))
        ORDER BY s.updated_at DESC
        LIMIT 50
      `, [`%${search}%`])
    } else {
      sets = await query(`
        SELECT s.*, u.name as author_name, u.picture as author_picture,
          (SELECT COUNT(*) FROM cards c WHERE c.set_id = s.id) as card_count
        FROM sets s
        JOIN users u ON s.user_id = u.id
        WHERE s.is_public = TRUE
        ORDER BY s.updated_at DESC
        LIMIT 50
      `)
    }

    res.json(sets)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get public sets' })
  }
})

// Get a single public set with cards (for viewing)
router.get('/public/:id', async (req, res) => {
  try {
    const set = await queryOne(`
      SELECT s.*, u.name as author_name, u.picture as author_picture
      FROM sets s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1 AND s.is_public = TRUE
    `, [req.params.id])

    if (!set) {
      return res.status(404).json({ error: 'Set not found or not public' })
    }

    const cards = await query(
      'SELECT id, front, back, front_image, back_image, position FROM cards WHERE set_id = $1 ORDER BY position, created_at',
      [req.params.id]
    )

    res.json({ ...set, cards })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get public set' })
  }
})

// Copy a public set to user's account (requires auth)
router.post('/public/:id/copy', authenticateToken, async (req, res) => {
  try {
    // Get the public set
    const originalSet = await queryOne(
      'SELECT * FROM sets WHERE id = $1 AND is_public = TRUE',
      [req.params.id]
    )
    if (!originalSet) {
      return res.status(404).json({ error: 'Public set not found' })
    }

    // Get original cards
    const originalCards = await query(
      'SELECT * FROM cards WHERE set_id = $1 ORDER BY position, created_at',
      [req.params.id]
    )

    // Create new set for current user
    const newSetId = uuid()
    const now = new Date().toISOString()

    await execute(
      'INSERT INTO sets (id, user_id, name, description, is_public, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [newSetId, req.user.id, originalSet.name, originalSet.description, false, now, now]
    )

    // Copy all cards
    for (const card of originalCards) {
      const newCardId = uuid()
      await execute(
        'INSERT INTO cards (id, set_id, front, back, front_image, back_image, position, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [newCardId, newSetId, card.front, card.back, card.front_image, card.back_image, card.position, now]
      )
    }

    // Return the new set
    const newSet = await queryOne('SELECT * FROM sets WHERE id = $1', [newSetId])
    res.status(201).json({ ...newSet, card_count: originalCards.length })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to copy set' })
  }
})

// ============ PROTECTED ROUTES (auth required) ============
router.use(authenticateToken)

// Get all sets for current user
router.get('/', async (req, res) => {
  try {
    const sets = await query(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM cards c WHERE c.set_id = s.id) as card_count
      FROM sets s
      WHERE s.user_id = $1
      ORDER BY s.updated_at DESC
    `, [req.user.id])

    res.json(sets)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get sets' })
  }
})

// Get single set with cards
router.get('/:id', async (req, res) => {
  try {
    const set = await queryOne(
      'SELECT * FROM sets WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )

    if (!set) {
      return res.status(404).json({ error: 'Set not found' })
    }

    const cards = await query(
      'SELECT * FROM cards WHERE set_id = $1 ORDER BY position, created_at',
      [req.params.id]
    )

    // Get study sessions
    const sessions = await query(`
      SELECT * FROM study_sessions
      WHERE set_id = $1 AND user_id = $2 AND completed_at IS NOT NULL
      ORDER BY started_at DESC
      LIMIT 20
    `, [req.params.id, req.user.id])

    // Format study history with individual results for the frontend
    const studyHistory = await Promise.all(sessions.map(async (session) => {
      const results = await query(
        'SELECT card_id as "cardId", correct FROM study_results WHERE session_id = $1',
        [session.id]
      )
      
      return {
        id: session.id,
        date: session.completed_at || session.started_at,
        mode: session.mode,
        results: results.map(r => ({ cardId: r.cardId, correct: r.correct }))
      }
    }))

    res.json({ ...set, cards, studyHistory })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get set' })
  }
})

// Create set
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Name required' })
    }

    const id = uuid()
    const now = new Date().toISOString()

    await execute(
      'INSERT INTO sets (id, user_id, name, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, req.user.id, name, description || null, now, now]
    )

    const set = await queryOne('SELECT * FROM sets WHERE id = $1', [id])
    res.status(201).json(set)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create set' })
  }
})

// Update set
router.put('/:id', async (req, res) => {
  try {
    const { name, description, is_public } = req.body

    const existing = await queryOne(
      'SELECT * FROM sets WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!existing) {
      return res.status(404).json({ error: 'Set not found' })
    }

    const now = new Date().toISOString()
    await execute(
      'UPDATE sets SET name = $1, description = $2, is_public = $3, updated_at = $4 WHERE id = $5',
      [
        name || existing.name, 
        description ?? existing.description, 
        is_public !== undefined ? is_public : existing.is_public,
        now, 
        req.params.id
      ]
    )

    const set = await queryOne('SELECT * FROM sets WHERE id = $1', [req.params.id])
    res.json(set)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update set' })
  }
})

// Toggle set public/private
router.put('/:id/visibility', async (req, res) => {
  try {
    const { is_public } = req.body

    const existing = await queryOne(
      'SELECT * FROM sets WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!existing) {
      return res.status(404).json({ error: 'Set not found' })
    }

    const now = new Date().toISOString()
    await execute(
      'UPDATE sets SET is_public = $1, updated_at = $2 WHERE id = $3',
      [is_public, now, req.params.id]
    )

    const set = await queryOne('SELECT * FROM sets WHERE id = $1', [req.params.id])
    res.json(set)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update visibility' })
  }
})

// Delete set
router.delete('/:id', async (req, res) => {
  try {
    const existing = await queryOne(
      'SELECT * FROM sets WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!existing) {
      return res.status(404).json({ error: 'Set not found' })
    }

    await execute('DELETE FROM sets WHERE id = $1', [req.params.id])
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete set' })
  }
})

// Duplicate set
router.post('/:id/duplicate', async (req, res) => {
  try {
    // Get original set
    const originalSet = await queryOne(
      'SELECT * FROM sets WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!originalSet) {
      return res.status(404).json({ error: 'Set not found' })
    }

    // Get original cards
    const originalCards = await query(
      'SELECT * FROM cards WHERE set_id = $1 ORDER BY position, created_at',
      [req.params.id]
    )

    // Create new set
    const newSetId = uuid()
    const now = new Date().toISOString()
    const newName = `${originalSet.name} (Copy)`

    await execute(
      'INSERT INTO sets (id, user_id, name, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [newSetId, req.user.id, newName, originalSet.description, now, now]
    )

    // Copy all cards
    for (const card of originalCards) {
      const newCardId = uuid()
      await execute(
        'INSERT INTO cards (id, set_id, front, back, front_image, back_image, position, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [newCardId, newSetId, card.front, card.back, card.front_image, card.back_image, card.position, now]
      )
    }

    // Return the new set
    const newSet = await queryOne('SELECT * FROM sets WHERE id = $1', [newSetId])
    res.status(201).json({ ...newSet, card_count: originalCards.length })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to duplicate set' })
  }
})

export default router
