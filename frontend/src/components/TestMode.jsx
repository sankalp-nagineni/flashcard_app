import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Clock, Check, X, RotateCcw, PenLine, List } from 'lucide-react'
import confetti from 'canvas-confetti'

function TestMode({ cards, onExit }) {
  const [testType, setTestType] = useState(null) // 'written' or 'multiple'
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [mcOptions, setMcOptions] = useState({}) // Multiple choice options for each card
  const [submitted, setSubmitted] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const timerRef = useRef(null)

  const startTest = (type) => {
    setTestType(type)
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setQuestions(shuffled)
    setStartTime(Date.now())

    // Generate multiple choice options for each card
    if (type === 'multiple') {
      const options = {}
      shuffled.forEach(card => {
        // Get wrong answers from other cards
        const otherAnswers = cards
          .filter(c => c.id !== card.id)
          .map(c => c.back)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
        
        // Combine with correct answer and shuffle
        const allOptions = [...new Set([...otherAnswers, card.back])]
          .sort(() => Math.random() - 0.5)
        
        options[card.id] = allOptions
      })
      setMcOptions(options)
    }
  }

  useEffect(() => {
    if (startTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [startTime])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (cardId, value) => {
    setAnswers(prev => ({ ...prev, [cardId]: value }))
  }

  const normalizeAnswer = (str) => {
    return str.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ')
  }

  const checkWrittenAnswer = (userAnswer, correctAnswer) => {
    const normalized = normalizeAnswer(userAnswer)
    const correct = normalizeAnswer(correctAnswer)
    
    if (normalized === correct) return true
    
    const correctWords = correct.split(' ').filter(w => w.length > 3)
    const matchedWords = correctWords.filter(w => normalized.includes(w))
    
    if (correctWords.length > 0 && matchedWords.length / correctWords.length >= 0.7) {
      return true
    }
    
    return false
  }

  const checkAnswer = (cardId, correctAnswer) => {
    const userAnswer = answers[cardId] || ''
    if (testType === 'multiple') {
      return userAnswer === correctAnswer
    }
    return checkWrittenAnswer(userAnswer, correctAnswer)
  }

  const handleSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setSubmitted(true)
  }

  const getResults = () => {
    return questions.map(q => ({
      card: q,
      userAnswer: answers[q.id] || '',
      correct: checkAnswer(q.id, q.back)
    }))
  }

  const results = submitted ? getResults() : []
  const correctCount = results.filter(r => r.correct).length
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0

  // Trigger confetti for perfect score
  useEffect(() => {
    if (submitted && score === 100) {
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
  }, [submitted, score])

  const handleExit = () => {
    const studyResults = results.map(r => ({
      cardId: r.card.id,
      correct: r.correct
    }))
    onExit(studyResults)
  }

  const restartTest = () => {
    setTestType(null)
    setQuestions([])
    setAnswers({})
    setMcOptions({})
    setSubmitted(false)
    setStartTime(null)
    setElapsedTime(0)
  }

  // Test type selection screen
  if (!testType) {
    return (
      <div className="test-mode study-mode">
        <div className="study-header">
          <button className="btn btn-ghost" onClick={() => onExit(null)}>
            <ArrowLeft size={14} strokeWidth={1.5} />
            Exit
          </button>
        </div>

        <div className="test-type-selection">
          <h2>Choose Test Type</h2>
          <p>Select how you want to be tested on {cards.length} cards</p>

          <div className="test-type-options">
            <button 
              className="test-type-btn"
              onClick={() => startTest('written')}
            >
              <div className="type-icon">
                <PenLine size={32} strokeWidth={1.5} />
              </div>
              <div className="type-info">
                <h3>Written</h3>
                <p>Type your answers for each question</p>
              </div>
            </button>

            <button 
              className="test-type-btn"
              onClick={() => startTest('multiple')}
              disabled={cards.length < 4}
            >
              <div className="type-icon">
                <List size={32} strokeWidth={1.5} />
              </div>
              <div className="type-info">
                <h3>Multiple Choice</h3>
                <p>Choose the correct answer from 4 options</p>
                {cards.length < 4 && (
                  <span className="type-warning">Requires at least 4 cards</span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Results screen
  if (submitted) {
    return (
      <div className="test-mode study-mode">
        <div className="study-header">
          <button className="btn btn-ghost" onClick={handleExit}>
            <ArrowLeft size={14} strokeWidth={1.5} />
            Exit
          </button>
          <div className="test-time-display">
            <Clock size={14} strokeWidth={1.5} />
            Completed in {formatTime(elapsedTime)}
          </div>
        </div>

        <div className="results-card">
          <h2>Test Complete</h2>
          <p className="results-subtitle">
            {testType === 'written' ? 'Written Test' : 'Multiple Choice Test'}
          </p>
          <div className="results-score">
            <span className="score-number">{score}%</span>
            <span className="score-label">Score</span>
          </div>
          <div className="results-breakdown">
            <div className="result-stat correct">
              <span>{correctCount}</span>
              Correct
            </div>
            <div className="result-stat incorrect">
              <span>{questions.length - correctCount}</span>
              Incorrect
            </div>
          </div>
        </div>

        <div className="test-review">
          <h3>Review Answers</h3>
          <div className="review-list">
            {results.map((result, index) => (
              <div key={result.card.id} className={`review-item ${result.correct ? 'correct' : 'incorrect'}`}>
                <div className="review-number">{index + 1}</div>
                <div className="review-content">
                  <div className="review-question">{result.card.front}</div>
                  <div className="review-answers">
                    <div className="your-answer">
                      <span className="answer-label">Your answer:</span>
                      <span className={result.correct ? 'answer-correct' : 'answer-incorrect'}>
                        {result.userAnswer || '(no answer)'}
                        {result.correct ? <Check size={14} /> : <X size={14} />}
                      </span>
                    </div>
                    {!result.correct && (
                      <div className="correct-answer">
                        <span className="answer-label">Correct answer:</span>
                        <span>{result.card.back}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="results-actions">
          <button className="btn btn-primary" onClick={restartTest}>
            <RotateCcw size={14} strokeWidth={1.5} />
            Retake Test
          </button>
          <button className="btn btn-secondary" onClick={handleExit}>
            Done
          </button>
        </div>
      </div>
    )
  }

  // Test taking screen
  return (
    <div className="test-mode study-mode">
      <div className="study-header">
        <button className="btn btn-ghost" onClick={() => onExit(null)}>
          <ArrowLeft size={14} strokeWidth={1.5} />
          Exit
        </button>
        <div className="test-timer">
          <Clock size={14} strokeWidth={1.5} />
          <span>{formatTime(elapsedTime)}</span>
        </div>
        <div className="test-progress">
          {Object.keys(answers).length} / {questions.length} answered
        </div>
      </div>

      <div className="test-instructions">
        <h2>{testType === 'written' ? 'Written Test' : 'Multiple Choice Test'}</h2>
        <p>
          {testType === 'written' 
            ? 'Type your answers for each question below.'
            : 'Select the correct answer for each question.'}
        </p>
      </div>

      <div className="test-questions">
        {questions.map((card, index) => (
          <div key={card.id} className={`test-question ${answers[card.id] ? 'answered' : ''}`}>
            <div className="question-header">
              <span className="question-number">{index + 1}</span>
              <span className="question-text">{card.front}</span>
            </div>
            
            {testType === 'written' ? (
              <textarea
                value={answers[card.id] || ''}
                onChange={(e) => handleAnswerChange(card.id, e.target.value)}
                placeholder="Type your answer..."
                rows={2}
              />
            ) : (
              <div className="mc-options">
                {mcOptions[card.id]?.map((option, optIndex) => (
                  <button
                    key={optIndex}
                    className={`mc-option ${answers[card.id] === option ? 'selected' : ''}`}
                    onClick={() => handleAnswerChange(card.id, option)}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + optIndex)}
                    </span>
                    <span className="option-text">{option}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="test-submit">
        <button 
          className="btn btn-success btn-submit"
          onClick={handleSubmit}
        >
          <Check size={14} strokeWidth={1.5} />
          Submit Test ({Object.keys(answers).length}/{questions.length} answered)
        </button>
      </div>
    </div>
  )
}

export default TestMode
