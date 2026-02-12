import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, RotateCcw, HelpCircle, ChevronRight, Shuffle, Brain, BookOpen, Lightbulb } from 'lucide-react'
import confetti from 'canvas-confetti'

function LearnMode({ cards, onExit, studyHistory = [] }) {
  const [mode, setMode] = useState(null) // null = selection, 'regular', 'personalized'
  const [direction, setDirection] = useState('definition') // 'definition' or 'term'
  const [cardQueue, setCardQueue] = useState([])
  
  // Get prompt and answer based on direction
  const getPrompt = (card) => direction === 'definition' ? card.front : card.back
  const getAnswer = (card) => direction === 'definition' ? card.back : card.front
  const promptLabel = direction === 'definition' ? 'Select the correct definition' : 'Select the correct term'
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState('quiz')
  const [options, setOptions] = useState([])
  const [selected, setSelected] = useState(null)
  const [isComplete, setIsComplete] = useState(false)
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 })
  const [missedCards, setMissedCards] = useState([])
  const [studyResults, setStudyResults] = useState([])
  const [cardMastery, setCardMastery] = useState({})

  // Calculate mastery for each card based on study history
  const calculateMastery = useMemo(() => {
    const mastery = {}
    
    cards.forEach(card => {
      mastery[card.id] = { correct: 0, incorrect: 0, lastSeen: null, weight: 1 }
    })

    // Process study history
    if (studyHistory && studyHistory.length > 0) {
      studyHistory.forEach(session => {
        session.results?.forEach(result => {
          if (mastery[result.cardId]) {
            if (result.correct) {
              mastery[result.cardId].correct++
            } else {
              mastery[result.cardId].incorrect++
            }
            mastery[result.cardId].lastSeen = session.date
          }
        })
      })
    }

    // Calculate weight (higher = harder/needs more practice)
    Object.keys(mastery).forEach(cardId => {
      const m = mastery[cardId]
      const total = m.correct + m.incorrect
      
      if (total === 0) {
        // Never studied - high priority
        m.weight = 2
      } else {
        const accuracy = m.correct / total
        // Lower accuracy = higher weight
        m.weight = Math.max(0.2, 2 - accuracy * 1.5)
        
        // Boost weight if mostly incorrect
        if (m.incorrect > m.correct) {
          m.weight += 0.5
        }
      }
    })

    return mastery
  }, [cards, studyHistory])

  const startRegularMode = () => {
    setMode('regular')
    setCardMastery(calculateMastery)
    setCardQueue([...cards].sort(() => Math.random() - 0.5))
  }

  const startPersonalizedMode = () => {
    setMode('personalized')
    const mastery = calculateMastery
    setCardMastery(mastery)
    
    // Build weighted queue - harder cards appear more often
    const weightedQueue = []
    
    cards.forEach(card => {
      const weight = mastery[card.id]?.weight || 1
      // Add card multiple times based on weight
      const copies = Math.ceil(weight * 2)
      for (let i = 0; i < copies; i++) {
        weightedQueue.push({ ...card, isRepeat: i > 0 })
      }
    })
    
    // Shuffle but try to spread out repeats
    const shuffled = weightedQueue.sort(() => Math.random() - 0.5)
    
    // Limit to reasonable number (2x original deck size)
    const limited = shuffled.slice(0, Math.min(shuffled.length, cards.length * 2))
    
    setCardQueue(limited)
  }

  const currentCard = cardQueue[currentIndex]

  useEffect(() => {
    if (currentCard && mode) {
      generateQuiz(currentCard)
    }
  }, [currentIndex, mode])

  // Trigger confetti for perfect score
  useEffect(() => {
    if (isComplete) {
      const totalAttempts = stats.correct + stats.incorrect
      const percentage = totalAttempts > 0 ? Math.round((stats.correct / totalAttempts) * 100) : 0
      
      if (percentage === 100) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
          })
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
          })
        }, 250)
      }
    }
  }, [isComplete, stats])

  const generateQuiz = (card) => {
    const correctAnswer = getAnswer(card)
    const otherCards = cards.filter(c => c.id !== card.id)
    const shuffled = [...otherCards].sort(() => Math.random() - 0.5)
    const wrongOptions = shuffled.slice(0, Math.min(3, otherCards.length)).map(c => getAnswer(c))
    
    const uniqueWrong = [...new Set(wrongOptions)].filter(opt => opt !== correctAnswer)
    
    const allOptions = [...uniqueWrong.slice(0, 3), correctAnswer]
      .sort(() => Math.random() - 0.5)
    
    setOptions(allOptions)
    setPhase('quiz')
  }

  const handleSelect = (option) => {
    setSelected(option)
    setPhase('feedback')

    const isCorrect = option === getAnswer(currentCard)
    
    // Record result
    setStudyResults(prev => [...prev, { cardId: currentCard.id, correct: isCorrect }])
    
    // Update local mastery tracking
    setCardMastery(prev => ({
      ...prev,
      [currentCard.id]: {
        ...prev[currentCard.id],
        correct: (prev[currentCard.id]?.correct || 0) + (isCorrect ? 1 : 0),
        incorrect: (prev[currentCard.id]?.incorrect || 0) + (isCorrect ? 0 : 1),
      }
    }))

    if (isCorrect) {
      setStats(prev => ({ ...prev, correct: prev.correct + 1 }))
    } else {
      setStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }))
      if (!missedCards.find(c => c.id === currentCard.id)) {
        setMissedCards(prev => [...prev, currentCard])
      }
    }
  }

  const handleContinue = () => {
    if (currentIndex < cardQueue.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelected(null)
    } else if (missedCards.length > 0) {
      // In personalized mode, add missed cards with higher frequency
      if (mode === 'personalized') {
        const retryCards = []
        missedCards.forEach(card => {
          // Add each missed card 2 times
          retryCards.push(card, card)
        })
        setCardQueue(prev => [...prev, ...retryCards.sort(() => Math.random() - 0.5)])
      } else {
        setCardQueue(prev => [...prev, ...missedCards])
      }
      setMissedCards([])
      setCurrentIndex(currentIndex + 1)
      setSelected(null)
    } else {
      setIsComplete(true)
    }
  }

  const handleExit = () => {
    // Exit without saving (user quit early)
    onExit([])
  }

  const handleComplete = () => {
    // Save results only when session is fully completed
    onExit(studyResults)
  }

  const restart = () => {
    if (mode === 'personalized') {
      startPersonalizedMode()
    } else {
      startRegularMode()
    }
    setCurrentIndex(0)
    setPhase('quiz')
    setOptions([])
    setSelected(null)
    setStats({ correct: 0, incorrect: 0 })
    setMissedCards([])
    setStudyResults([])
    setIsComplete(false)
  }

  const backToSelection = () => {
    setMode(null)
    setCardQueue([])
    setCurrentIndex(0)
    setPhase('quiz')
    setOptions([])
    setSelected(null)
    setStats({ correct: 0, incorrect: 0 })
    setMissedCards([])
    setStudyResults([])
    setIsComplete(false)
  }

  if (cards.length === 0) {
    return (
      <div className="study-mode">
        <p>No cards to study</p>
        <button className="btn btn-secondary" onClick={() => onExit([])}>
          <ArrowLeft size={14} strokeWidth={1.5} />
          Back
        </button>
      </div>
    )
  }

  // Mode selection screen
  if (!mode) {
    const masteryData = calculateMastery
    const hardCards = Object.values(masteryData).filter(m => m.weight > 1.2).length
    const newCards = Object.values(masteryData).filter(m => m.correct + m.incorrect === 0).length

    return (
      <div className="study-mode learn-mode">
        <div className="study-header">
          <button className="btn btn-secondary" onClick={() => onExit([])}>
            <ArrowLeft size={14} strokeWidth={1.5} />
            Back
          </button>
          <span className="progress">{cards.length} cards</span>
        </div>

        <div className="mode-selection">
          <h2>Choose Learning Mode</h2>
          
          <div className="direction-toggle">
            <button 
              className={`direction-btn ${direction === 'definition' ? 'active' : ''}`}
              onClick={() => setDirection('definition')}
            >
              <BookOpen size={16} strokeWidth={1.5} />
              Answer with Definition
            </button>
            <button 
              className={`direction-btn ${direction === 'term' ? 'active' : ''}`}
              onClick={() => setDirection('term')}
            >
              <Lightbulb size={16} strokeWidth={1.5} />
              Answer with Term
            </button>
          </div>
          
          <div className="mode-options">
            <button className="mode-option-card" onClick={startRegularMode}>
              <div className="mode-icon">
                <Shuffle size={28} strokeWidth={1.5} />
              </div>
              <h3>Regular Learn</h3>
              <p>Randomized practice through all cards equally. Great for initial learning.</p>
              <span className="mode-tag">All {cards.length} cards</span>
            </button>

            <button className="mode-option-card personalized" onClick={startPersonalizedMode}>
              <div className="mode-icon">
                <Brain size={28} strokeWidth={1.5} />
              </div>
              <h3>Personalized Learn</h3>
              <p>Adaptive algorithm focuses on cards you struggle with. Harder cards appear more often.</p>
              <div className="mode-stats">
                {hardCards > 0 && (
                  <span className="mode-tag warning">{hardCards} need practice</span>
                )}
                {newCards > 0 && (
                  <span className="mode-tag new">{newCards} new</span>
                )}
                {hardCards === 0 && newCards === 0 && (
                  <span className="mode-tag success">All mastered!</span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isComplete) {
    const totalAttempts = stats.correct + stats.incorrect
    const percentage = totalAttempts > 0 ? Math.round((stats.correct / totalAttempts) * 100) : 0
    
    // Calculate mastery improvements
    const improvedCards = Object.entries(cardMastery).filter(([id, m]) => {
      const initial = calculateMastery[id]
      return m.correct > (initial?.correct || 0)
    }).length

    return (
      <div className="study-mode">
        <div className="results-card">
          <h2>Complete</h2>
          {mode === 'personalized' && (
            <span className="mode-badge">Personalized</span>
          )}
          <div className="results-score">
            <span className="score-number">{percentage}%</span>
            <span className="score-label">Accuracy</span>
          </div>
          <div className="results-breakdown">
            <div className="result-stat correct">
              <span>{stats.correct}</span> Correct
            </div>
            <div className="result-stat incorrect">
              <span>{stats.incorrect}</span> Incorrect
            </div>
          </div>
          {mode === 'personalized' && improvedCards > 0 && (
            <p className="mastery-note">
              📈 {improvedCards} card{improvedCards > 1 ? 's' : ''} improved this session
            </p>
          )}
          <div className="results-actions">
            <button className="btn btn-primary" onClick={restart}>
              <RotateCcw size={14} strokeWidth={1.5} />
              Retry
            </button>
            <button className="btn btn-secondary" onClick={backToSelection}>
              Change Mode
            </button>
            <button className="btn btn-secondary" onClick={handleComplete}>
              <ArrowLeft size={14} strokeWidth={1.5} />
              Exit
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!currentCard) return null

  const uniqueCardsCount = new Set(cardQueue.map(c => c.id)).size
  const isRetryCard = currentIndex >= cardQueue.filter((c, i) => 
    cardQueue.findIndex(x => x.id === c.id) === i
  ).length

  // Get current card's mastery info for personalized mode
  const currentMastery = cardMastery[currentCard.id]
  const isHardCard = currentMastery && currentMastery.weight > 1.2

  return (
    <div className="study-mode learn-mode">
      <div className="study-header">
        <button className="btn btn-secondary" onClick={handleExit}>
          <ArrowLeft size={14} strokeWidth={1.5} />
          Exit
        </button>
        <span className="progress">
          {currentIndex + 1} / {cardQueue.length}
          {mode === 'personalized' && <span className="mode-indicator">Personalized</span>}
          {isRetryCard && <span className="retry-badge">Retry</span>}
        </span>
        <div className="mini-stats">
          <span className="mini-correct">{stats.correct}</span>
          <span className="mini-incorrect">{stats.incorrect}</span>
        </div>
      </div>

      <div className="learn-card">
        {phase === 'quiz' && (
          <>
            <div className="learn-term">
              <span className="term-label">
                <HelpCircle size={10} strokeWidth={1.5} />
                {promptLabel}
                {mode === 'personalized' && isHardCard && (
                  <span className="focus-badge">Focus Card</span>
                )}
              </span>
              <p className="term-text">{getPrompt(currentCard)}</p>
            </div>
            <div className="quiz-options">
              {options.map((option, i) => (
                <button
                  key={i}
                  className="quiz-option"
                  onClick={() => handleSelect(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        )}

        {phase === 'feedback' && (
          <>
            <div className="learn-term">
              <p className="term-text">{getPrompt(currentCard)}</p>
            </div>
            <div className="quiz-options">
              {options.map((option, i) => {
                const isCorrectAnswer = option === getAnswer(currentCard)
                const isSelected = option === selected
                let className = 'quiz-option'
                
                if (isCorrectAnswer) {
                  className += ' correct'
                } else if (isSelected && !isCorrectAnswer) {
                  className += ' incorrect'
                } else {
                  className += ' disabled'
                }
                
                return (
                  <button key={i} className={className} disabled>
                    {option}
                  </button>
                )
              })}
            </div>
            <button className="btn btn-primary" onClick={handleContinue}>
              {currentIndex < cardQueue.length - 1 || missedCards.length > 0 ? (
                <>Continue <ChevronRight size={14} strokeWidth={1.5} /></>
              ) : (
                'Results'
              )}
            </button>
          </>
        )}
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${((currentIndex + 1) / cardQueue.length) * 100}%` }}
        />
      </div>
    </div>
  )
}

export default LearnMode
