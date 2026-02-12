import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { query, queryOne, execute } from '../db/init.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

router.use(authenticateToken)

// Start a study session
router.post('/sessions', async (req, res) => {
  try {
    const { set_id, mode } = req.body

    if (!set_id || !mode) {
      return res.status(400).json({ error: 'set_id and mode required' })
    }

    // Verify set ownership
    const set = await queryOne(
      'SELECT id FROM sets WHERE id = $1 AND user_id = $2',
      [set_id, req.user.id]
    )
    if (!set) {
      return res.status(404).json({ error: 'Set not found' })
    }

    const id = uuid()
    const now = new Date().toISOString()

    await execute(
      'INSERT INTO study_sessions (id, user_id, set_id, mode, started_at) VALUES ($1, $2, $3, $4, $5)',
      [id, req.user.id, set_id, mode, now]
    )

    res.status(201).json({ id, set_id, mode, started_at: now })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to start session' })
  }
})

// Record study results
router.post('/sessions/:sessionId/results', async (req, res) => {
  try {
    const { results } = req.body // Array of { card_id, correct, response_time_ms }

    if (!results || !Array.isArray(results)) {
      return res.status(400).json({ error: 'results array required' })
    }

    // Verify session ownership
    const session = await queryOne(
      'SELECT * FROM study_sessions WHERE id = $1 AND user_id = $2',
      [req.params.sessionId, req.user.id]
    )
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const now = new Date().toISOString()

    for (const result of results) {
      // Insert study result
      await execute(
        'INSERT INTO study_results (id, session_id, card_id, correct, response_time_ms) VALUES ($1, $2, $3, $4, $5)',
        [uuid(), req.params.sessionId, result.card_id, result.correct, result.response_time_ms || null]
      )

      // Check if mastery exists
      const existing = await queryOne(
        'SELECT * FROM card_mastery WHERE user_id = $1 AND card_id = $2',
        [req.user.id, result.card_id]
      )

      if (existing) {
        // Update existing mastery
        await execute(`
          UPDATE card_mastery 
          SET correct_count = correct_count + $1, incorrect_count = incorrect_count + $2, last_reviewed = $3
          WHERE user_id = $4 AND card_id = $5
        `, [result.correct ? 1 : 0, result.correct ? 0 : 1, now, req.user.id, result.card_id])
      } else {
        // Insert new mastery
        await execute(`
          INSERT INTO card_mastery (id, user_id, card_id, correct_count, incorrect_count, last_reviewed)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [uuid(), req.user.id, result.card_id, result.correct ? 1 : 0, result.correct ? 0 : 1, now])
      }
    }

    // Mark session as completed
    await execute(
      'UPDATE study_sessions SET completed_at = $1 WHERE id = $2',
      [now, req.params.sessionId]
    )

    res.json({ success: true, results_recorded: results.length })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to record results' })
  }
})

// Get study stats for a set
router.get('/stats/:setId', async (req, res) => {
  try {
    // Verify set ownership
    const set = await queryOne(
      'SELECT id FROM sets WHERE id = $1 AND user_id = $2',
      [req.params.setId, req.user.id]
    )
    if (!set) {
      return res.status(404).json({ error: 'Set not found' })
    }

    // Get cards with mastery
    const cards = await query(`
      SELECT c.id, c.front, c.back,
        COALESCE(cm.correct_count, 0) as correct_count,
        COALESCE(cm.incorrect_count, 0) as incorrect_count,
        cm.last_reviewed
      FROM cards c
      LEFT JOIN card_mastery cm ON cm.card_id = c.id AND cm.user_id = $1
      WHERE c.set_id = $2
    `, [req.user.id, req.params.setId])

    // Calculate stats
    let mastered = 0
    let learning = 0
    let notStarted = 0
    let totalCorrect = 0
    let totalIncorrect = 0

    cards.forEach(card => {
      const correctCount = parseInt(card.correct_count) || 0
      const incorrectCount = parseInt(card.incorrect_count) || 0
      const attempts = correctCount + incorrectCount
      totalCorrect += correctCount
      totalIncorrect += incorrectCount

      if (attempts === 0) {
        notStarted++
      } else if (correctCount >= 3 && correctCount / attempts >= 0.8) {
        mastered++
      } else {
        learning++
      }
    })

    // Get recent sessions
    const sessions = await query(`
      SELECT ss.*,
        (SELECT COUNT(*) FROM study_results sr WHERE sr.session_id = ss.id AND sr.correct = true) as correct,
        (SELECT COUNT(*) FROM study_results sr WHERE sr.session_id = ss.id) as total
      FROM study_sessions ss
      WHERE ss.set_id = $1 AND ss.user_id = $2 AND ss.completed_at IS NOT NULL
      ORDER BY ss.completed_at DESC
      LIMIT 10
    `, [req.params.setId, req.user.id])

    const totalAttempts = totalCorrect + totalIncorrect
    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0

    res.json({
      totalCards: cards.length,
      mastered,
      learning,
      notStarted,
      accuracy,
      totalSessions: sessions.length,
      recentSessions: sessions
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get stats' })
  }
})

export default router
