import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { query, queryOne, execute } from '../db/init.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

router.use(authenticateToken)

// Helper to verify set ownership
async function verifySetOwnership(setId, userId) {
  return await queryOne(
    'SELECT id FROM sets WHERE id = $1 AND user_id = $2',
    [setId, userId]
  )
}

// Get cards for a set
router.get('/set/:setId', async (req, res) => {
  try {
    if (!await verifySetOwnership(req.params.setId, req.user.id)) {
      return res.status(404).json({ error: 'Set not found' })
    }

    const cards = await query(
      'SELECT * FROM cards WHERE set_id = $1 ORDER BY position, created_at',
      [req.params.setId]
    )
    res.json(cards)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get cards' })
  }
})

// Create card
router.post('/', async (req, res) => {
  try {
    const { set_id, front, back, front_image, back_image } = req.body

    if (!set_id || !front || !back) {
      return res.status(400).json({ error: 'set_id, front, and back required' })
    }

    if (!await verifySetOwnership(set_id, req.user.id)) {
      return res.status(404).json({ error: 'Set not found' })
    }

    // Get next position
    const maxPos = await queryOne(
      'SELECT MAX(position) as max FROM cards WHERE set_id = $1',
      [set_id]
    )
    const position = (maxPos?.max || 0) + 1

    const id = uuid()
    await execute(
      'INSERT INTO cards (id, set_id, front, back, front_image, back_image, position) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, set_id, front, back, front_image || null, back_image || null, position]
    )

    // Update set's updated_at
    await execute(
      'UPDATE sets SET updated_at = $1 WHERE id = $2',
      [new Date().toISOString(), set_id]
    )

    const card = await queryOne('SELECT * FROM cards WHERE id = $1', [id])
    res.status(201).json(card)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create card' })
  }
})

// Bulk create cards
router.post('/bulk', async (req, res) => {
  try {
    const { set_id, cards } = req.body

    if (!set_id || !cards || !Array.isArray(cards)) {
      return res.status(400).json({ error: 'set_id and cards array required' })
    }

    if (!await verifySetOwnership(set_id, req.user.id)) {
      return res.status(404).json({ error: 'Set not found' })
    }

    const maxPos = await queryOne(
      'SELECT MAX(position) as max FROM cards WHERE set_id = $1',
      [set_id]
    )
    let position = (maxPos?.max || 0) + 1

    const createdCards = []
    
    for (const card of cards) {
      if (card.front && card.back) {
        const id = uuid()
        await execute(
          'INSERT INTO cards (id, set_id, front, back, position) VALUES ($1, $2, $3, $4, $5)',
          [id, set_id, card.front, card.back, position]
        )
        createdCards.push({ id, set_id, front: card.front, back: card.back, position })
        position++
      }
    }

    // Update set's updated_at
    await execute(
      'UPDATE sets SET updated_at = $1 WHERE id = $2',
      [new Date().toISOString(), set_id]
    )

    res.status(201).json(createdCards)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create cards' })
  }
})

// Update card
router.put('/:id', async (req, res) => {
  try {
    const { front, back, front_image, back_image } = req.body

    const card = await queryOne(`
      SELECT c.*, s.user_id FROM cards c 
      JOIN sets s ON c.set_id = s.id 
      WHERE c.id = $1
    `, [req.params.id])
    
    if (!card || card.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Card not found' })
    }

    await execute(
      'UPDATE cards SET front = $1, back = $2, front_image = $3, back_image = $4 WHERE id = $5',
      [
        front ?? card.front, 
        back ?? card.back, 
        front_image !== undefined ? front_image : card.front_image,
        back_image !== undefined ? back_image : card.back_image,
        req.params.id
      ]
    )
    await execute(
      'UPDATE sets SET updated_at = $1 WHERE id = $2',
      [new Date().toISOString(), card.set_id]
    )

    const updated = await queryOne('SELECT * FROM cards WHERE id = $1', [req.params.id])
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update card' })
  }
})

// Delete card
router.delete('/:id', async (req, res) => {
  try {
    const card = await queryOne(`
      SELECT c.*, s.user_id FROM cards c 
      JOIN sets s ON c.set_id = s.id 
      WHERE c.id = $1
    `, [req.params.id])
    
    if (!card || card.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Card not found' })
    }

    await execute('DELETE FROM cards WHERE id = $1', [req.params.id])
    await execute(
      'UPDATE sets SET updated_at = $1 WHERE id = $2',
      [new Date().toISOString(), card.set_id]
    )

    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete card' })
  }
})

export default router
