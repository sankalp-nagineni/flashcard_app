import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Check, X, ChevronRight, RotateCcw, HelpCircle, PenLine, BookOpen, Lightbulb } from 'lucide-react'
import confetti from 'canvas-confetti'

function WriteMode({ cards, onExit }) {
  const [mode, setMode] = useState(null) // 'term' or 'definition'
  const [cardQueue, setCardQueue] = useState(() => 
    [...cards].sort(() => Math.random() - 0.5)
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [result, setResult] = useState(null)
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 })
  const [isComplete, setIsComplete] = useState(false)
  const [missedCards, setMissedCards] = useState([])
  const [studyResults, setStudyResults] = useState([])
  const inputRef = useRef(null)
  
  // Get prompt and answer based on mode
  const getPrompt = (card) => mode === 'definition' ? card.front : card.back
  const getAnswer = (card) => mode === 'definition' ? card.back : card.front
  const promptLabel = mode === 'definition' ? 'Term' : 'Definition'
  const answerLabel = mode === 'definition' ? 'Definition' : 'Term'

  useEffect(() => {
    if (inputRef.current && !result) {
      inputRef.current.focus()
    }
  }, [currentIndex, result])

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

  const normalizeAnswer = (str) => {
    return str.toLowerCase().trim().replace(/[^\w\s]/g, '')
  }

  const checkAnswer = () => {
    if (!userAnswer.trim()) return

    const currentCard = cardQueue[currentIndex]
    const correct = normalizeAnswer(userAnswer) === normalizeAnswer(getAnswer(currentCard))
    
    // Record result
    setStudyResults(prev => [...prev, { cardId: currentCard.id, correct }])
    
    if (correct) {
      setResult('correct')
      setStats(prev => ({ ...prev, correct: prev.correct + 1 }))
    } else {
      setResult('incorrect')
      setStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }))
      if (!missedCards.find(c => c.id === currentCard.id)) {
        setMissedCards(prev => [...prev, currentCard])
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !result) {
      checkAnswer()
    }
  }

  const nextCard = () => {
    if (currentIndex < cardQueue.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setUserAnswer('')
      setResult(null)
    } else if (missedCards.length > 0) {
      setCardQueue(prev => [...prev, ...missedCards])
      setMissedCards([])
      setCurrentIndex(currentIndex + 1)
      setUserAnswer('')
      setResult(null)
    } else {
      setIsComplete(true)
    }
  }

  const overrideCorrect = () => {
    const currentCard = cardQueue[currentIndex]
    setStats(prev => ({ 
      correct: prev.correct + 1, 
      incorrect: prev.incorrect - 1 
    }))
    // Update the result record
    setStudyResults(prev => prev.map(r => 
      r.cardId === currentCard.id && !r.correct 
        ? { ...r, correct: true } 
        : r
    ))
    setResult('correct')
    setMissedCards(prev => prev.filter(c => c.id !== currentCard.id))
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
    setCardQueue([...cards].sort(() => Math.random() - 0.5))
    setCurrentIndex(0)
    setUserAnswer('')
    setResult(null)
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
    return (
      <div className="study-mode">
        <div className="mode-selection">
          <button className="btn btn-secondary back-btn" onClick={() => onExit([])}>
            <ArrowLeft size={14} strokeWidth={1.5} />
            Back
          </button>
          <h2>Write Mode</h2>
          <p className="mode-subtitle">How would you like to practice?</p>
          
          <div className="mode-options">
            <button 
              className="mode-option-card"
              onClick={() => setMode('definition')}
            >
              <div className="mode-icon">
                <BookOpen size={28} strokeWidth={1.5} />
              </div>
              <h3>Answer with Definition</h3>
              <p>See the term, type the definition</p>
            </button>
            
            <button 
              className="mode-option-card"
              onClick={() => setMode('term')}
            >
              <div className="mode-icon">
                <Lightbulb size={28} strokeWidth={1.5} />
              </div>
              <h3>Answer with Term</h3>
              <p>See the definition, type the term</p>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isComplete) {
    const totalAttempts = stats.correct + stats.incorrect
    const percentage = totalAttempts > 0 ? Math.round((stats.correct / totalAttempts) * 100) : 0
    return (
      <div className="study-mode">
        <div className="results-card">
          <h2>Complete</h2>
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
          <div className="results-actions">
            <button className="btn btn-primary" onClick={restart}>
              <RotateCcw size={14} strokeWidth={1.5} />
              Retry
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

  const currentCard = cardQueue[currentIndex]
  const originalCount = cards.length
  const isRetryCard = currentIndex >= originalCount

  return (
    <div className="study-mode write-mode">
      <div className="study-header">
        <button className="btn btn-secondary" onClick={handleExit}>
          <ArrowLeft size={14} strokeWidth={1.5} />
          Exit
        </button>
        <span className="progress">
          {Math.min(currentIndex + 1, originalCount)} / {originalCount}
          {isRetryCard && <span className="retry-badge">Retry</span>}
        </span>
        <div className="mini-stats">
          <span className="mini-correct">{stats.correct}</span>
          <span className="mini-incorrect">{stats.incorrect}</span>
        </div>
      </div>

      <div className="write-card">
        <div className="write-prompt">
          <span className="prompt-label">
            <HelpCircle size={10} strokeWidth={1.5} />
            {promptLabel}
          </span>
          <p className="prompt-text">{getPrompt(currentCard)}</p>
        </div>

        <div className="write-input-area">
          <label className="input-label">
            <PenLine size={10} strokeWidth={1.5} />
            Your {answerLabel}
          </label>
          <input
            ref={inputRef}
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer..."
            disabled={result !== null}
            className={result ? `input-${result}` : ''}
          />
          
          {!result && (
            <button className="btn btn-primary" onClick={checkAnswer}>
              <Check size={14} strokeWidth={1.5} />
              Check
            </button>
          )}
        </div>

        {result && (
          <div className={`write-feedback ${result}`}>
            {result === 'correct' ? (
              <p className="feedback-text">
                <Check size={16} strokeWidth={1.5} />
                Correct
              </p>
            ) : (
              <>
                <p className="feedback-text">
                  <X size={16} strokeWidth={1.5} />
                  Incorrect
                </p>
                <div className="correct-answer">
                  <span className="answer-label">Correct {answerLabel}</span>
                  <span className="answer-text">{getAnswer(currentCard)}</span>
                </div>
                <button className="btn-override" onClick={overrideCorrect}>
                  Override: I was correct
                </button>
              </>
            )}
            <button className="btn btn-primary" onClick={nextCard}>
              {currentIndex < cardQueue.length - 1 || missedCards.length > 0 ? (
                <>Next <ChevronRight size={14} strokeWidth={1.5} /></>
              ) : (
                'Results'
              )}
            </button>
          </div>
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

export default WriteMode
