import { useMemo } from 'react'
import { CheckCircle, Circle, TrendingUp, Clock, Brain, Target, Calendar } from 'lucide-react'

function StatsView({ cards, studyHistory }) {
  const stats = useMemo(() => {
    if (!studyHistory || studyHistory.length === 0) {
      return {
        mastered: 0,
        learning: 0,
        notStarted: cards.length,
        totalCards: cards.length,
        masteredPercent: 0,
        learningPercent: 0,
        notStartedPercent: 100,
        avgAccuracy: 0,
        studySessions: 0,
        retentionDays: 0,
        lastStudied: null
      }
    }

    // Calculate mastery based on study history
    const cardStats = {}
    cards.forEach(card => {
      cardStats[card.id] = { correct: 0, incorrect: 0, lastSeen: null }
    })

    studyHistory.forEach(session => {
      session.results?.forEach(result => {
        if (cardStats[result.cardId]) {
          if (result.correct) {
            cardStats[result.cardId].correct++
          } else {
            cardStats[result.cardId].incorrect++
          }
          cardStats[result.cardId].lastSeen = session.date
        }
      })
    })

    let mastered = 0
    let learning = 0
    let notStarted = 0
    let totalCorrect = 0
    let totalAttempts = 0

    Object.values(cardStats).forEach(stat => {
      const attempts = stat.correct + stat.incorrect
      totalAttempts += attempts
      totalCorrect += stat.correct

      if (attempts === 0) {
        notStarted++
      } else if (stat.correct >= 3 && stat.correct / attempts >= 0.8) {
        mastered++
      } else {
        learning++
      }
    })

    const avgAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0
    
    // Calculate predicted retention days using spaced repetition principles
    // Base stability starts at 1 day and increases with:
    // - Number of successful reviews
    // - Overall accuracy
    // - Number of mastered cards
    const baseStability = 1
    const masteryBonus = mastered * 0.5 // Each mastered card adds 0.5 days
    const accuracyBonus = (avgAccuracy / 100) * 2 // Up to 2 days from accuracy
    const sessionBonus = Math.min(studyHistory.length * 0.3, 3) // Up to 3 days from sessions
    
    // Total predicted days of retention from last study
    const retentionDays = Math.round(baseStability + masteryBonus + accuracyBonus + sessionBonus)
    
    // Calculate days since last study
    const lastSession = studyHistory[studyHistory.length - 1]
    const daysSinceStudy = lastSession 
      ? Math.floor((Date.now() - new Date(lastSession.date).getTime()) / (1000 * 60 * 60 * 24))
      : 0
    
    // Remaining days of retention
    const remainingDays = Math.max(0, retentionDays - daysSinceStudy)

    return {
      mastered,
      learning,
      notStarted,
      totalCards: cards.length,
      masteredPercent: cards.length > 0 ? Math.round((mastered / cards.length) * 100) : 0,
      learningPercent: cards.length > 0 ? Math.round((learning / cards.length) * 100) : 0,
      notStartedPercent: cards.length > 0 ? Math.round((notStarted / cards.length) * 100) : 0,
      avgAccuracy,
      studySessions: studyHistory.length,
      retentionDays: remainingDays,
      totalRetentionDays: retentionDays,
      daysSinceStudy,
      lastStudied: lastSession?.date || null
    }
  }, [cards, studyHistory])

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    // Handle future dates or very recent
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getRetentionStatus = (days) => {
    if (days >= 5) return { color: 'var(--moss)', label: 'Strong', message: 'Your memory is solid. Review when convenient.' }
    if (days >= 2) return { color: 'var(--ochre)', label: 'Good', message: 'Consider reviewing in the next few days.' }
    if (days >= 1) return { color: 'var(--ochre)', label: 'Fading', message: 'Review soon to maintain memory.' }
    return { color: 'var(--terracotta)', label: 'Weak', message: 'Review now to prevent forgetting.' }
  }

  const retentionStatus = getRetentionStatus(stats.retentionDays)

  return (
    <div className="stats-view">
      <div className="stats-section">
        <h3>
          <Target size={14} strokeWidth={1.5} />
          Progress
        </h3>
        
        <div className="progress-visual">
          <div className="progress-ring">
            <svg viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="var(--paper-dark)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="var(--moss)"
                strokeWidth="8"
                strokeDasharray={`${stats.masteredPercent * 2.64} 264`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="var(--ochre)"
                strokeWidth="8"
                strokeDasharray={`${stats.learningPercent * 2.64} 264`}
                strokeDashoffset={`${-stats.masteredPercent * 2.64}`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="progress-ring-center">
              <span className="ring-number">{stats.masteredPercent}%</span>
              <span className="ring-label">Mastered</span>
            </div>
          </div>
        </div>

        <div className="progress-legend">
          <div className="legend-item">
            <span className="legend-dot mastered"></span>
            <span className="legend-label">Mastered</span>
            <span className="legend-value">{stats.mastered}</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot learning"></span>
            <span className="legend-label">Learning</span>
            <span className="legend-value">{stats.learning}</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot not-started"></span>
            <span className="legend-label">Not Started</span>
            <span className="legend-value">{stats.notStarted}</span>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <h3>
          <Calendar size={14} strokeWidth={1.5} />
          Memory Retention
        </h3>
        
        <div className="retention-display">
          <div className="retention-days">
            <span 
              className="days-number"
              style={{ color: retentionStatus.color }}
            >
              {stats.retentionDays}
            </span>
            <span className="days-label">
              {stats.retentionDays === 1 ? 'day' : 'days'}
            </span>
          </div>
          <p className="retention-subtitle">Predicted memory retention remaining</p>
          
          <div className="retention-status" style={{ borderColor: retentionStatus.color }}>
            <span className="status-badge" style={{ background: retentionStatus.color }}>
              {retentionStatus.label}
            </span>
            <p className="status-message">{retentionStatus.message}</p>
          </div>
        </div>

        <div className="retention-timeline">
          <div className="timeline-bar">
            <div 
              className="timeline-fill"
              style={{ 
                width: `${Math.min(100, (stats.retentionDays / stats.totalRetentionDays) * 100)}%`,
                background: retentionStatus.color
              }}
            />
            <div 
              className="timeline-marker"
              style={{ left: `${Math.min(100, (stats.retentionDays / stats.totalRetentionDays) * 100)}%` }}
            />
          </div>
          <div className="timeline-labels">
            <span>Now</span>
            <span>{stats.totalRetentionDays} days</span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <TrendingUp size={16} strokeWidth={1.5} />
          <span className="stat-card-value">{stats.avgAccuracy}%</span>
          <span className="stat-card-label">Avg Accuracy</span>
        </div>
        <div className="stat-card">
          <CheckCircle size={16} strokeWidth={1.5} />
          <span className="stat-card-value">{stats.studySessions}</span>
          <span className="stat-card-label">Sessions Completed</span>
        </div>
        <div className="stat-card">
          <Clock size={16} strokeWidth={1.5} />
          <span className="stat-card-value">{formatDate(stats.lastStudied)}</span>
          <span className="stat-card-label">Last Studied</span>
        </div>
      </div>
    </div>
  )
}

export default StatsView
