import { useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Shuffle } from 'lucide-react'
import Flashcard from './Flashcard'

function StudyMode({ cards, onExit }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [shuffledCards, setShuffledCards] = useState(() => 
    [...cards].sort(() => Math.random() - 0.5)
  )

  const goNext = () => {
    if (currentIndex < shuffledCards.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const shuffle = () => {
    setShuffledCards([...cards].sort(() => Math.random() - 0.5))
    setCurrentIndex(0)
  }

  if (shuffledCards.length === 0) {
    return (
      <div className="study-mode">
        <p>No cards to study</p>
        <button className="btn btn-secondary" onClick={onExit}>
          <ArrowLeft size={14} strokeWidth={1.5} />
          Back
        </button>
      </div>
    )
  }

  return (
    <div className="study-mode">
      <div className="study-header">
        <button className="btn btn-secondary" onClick={onExit}>
          <ArrowLeft size={14} strokeWidth={1.5} />
          Exit
        </button>
        <span className="progress">
          {currentIndex + 1} / {shuffledCards.length}
        </span>
        <button className="btn btn-secondary" onClick={shuffle}>
          <Shuffle size={14} strokeWidth={1.5} />
          Shuffle
        </button>
      </div>

      <div className="study-card">
        <Flashcard card={shuffledCards[currentIndex]} />
      </div>

      <div className="study-controls">
        <button 
          className="btn btn-nav" 
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
          Previous
        </button>
        <button 
          className="btn btn-nav" 
          onClick={goNext}
          disabled={currentIndex === shuffledCards.length - 1}
        >
          Next
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${((currentIndex + 1) / shuffledCards.length) * 100}%` }}
        />
      </div>
    </div>
  )
}

export default StudyMode
