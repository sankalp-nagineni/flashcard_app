import { useState } from 'react'
import { Plus } from 'lucide-react'

function FlashcardForm({ onAddCard }) {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (front.trim() && back.trim()) {
      onAddCard({ front: front.trim(), back: back.trim(), id: Date.now() })
      setFront('')
      setBack('')
    }
  }

  return (
    <form className="flashcard-form" onSubmit={handleSubmit}>
      <h2>
        <Plus size={14} strokeWidth={1.5} />
        New Card
      </h2>
      <div className="form-group">
        <label htmlFor="front">Question / Front</label>
        <textarea
          id="front"
          value={front}
          onChange={(e) => setFront(e.target.value)}
          placeholder="Enter the question or term..."
          rows={3}
        />
      </div>
      <div className="form-group">
        <label htmlFor="back">Answer / Back</label>
        <textarea
          id="back"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          placeholder="Enter the answer or definition..."
          rows={3}
        />
      </div>
      <button type="submit" className="btn btn-primary">
        <Plus size={14} strokeWidth={1.5} />
        Add Card
      </button>
    </form>
  )
}

export default FlashcardForm
