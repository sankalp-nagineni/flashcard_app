import { useState } from 'react'
import { HelpCircle, Lightbulb, RotateCcw, Trash2, Pencil, Image, X } from 'lucide-react'
import EditCardModal from './EditCardModal'

function Flashcard({ card, onDelete, onEdit }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [viewingImage, setViewingImage] = useState(null)

  const BinderRings = () => (
    <div className="card-binder">
      <div className="binder-ring"></div>
      <div className="binder-ring"></div>
      <div className="binder-ring"></div>
      <div className="binder-ring"></div>
      <div className="binder-ring"></div>
    </div>
  )

  const handleEdit = (e) => {
    e.stopPropagation()
    setShowEditModal(true)
  }

  const handleSave = async (data) => {
    if (onEdit) {
      await onEdit(card.id, data)
    }
  }

  const handleImageClick = (e, imageUrl) => {
    e.stopPropagation()
    setViewingImage(imageUrl)
  }

  const closeImageViewer = () => {
    setViewingImage(null)
  }

  const hasImages = card.front_image || card.back_image

  return (
    <>
      <div className="flashcard-container">
        <div 
          className={`flashcard ${isFlipped ? 'flipped' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <BinderRings />
              <div className="card-content">
                <span className="card-label">
                  <HelpCircle size={10} strokeWidth={1.5} />
                  Question
                  {hasImages && <Image size={10} strokeWidth={1.5} className="has-image-icon" />}
                </span>
                <p>{card.front}</p>
                {card.front_image && (
                  <div 
                    className="card-image" 
                    onClick={(e) => handleImageClick(e, card.front_image)}
                  >
                    <img src={card.front_image} alt="Question" />
                  </div>
                )}
                <span className="flip-hint">
                  <RotateCcw size={10} strokeWidth={1.5} />
                  click to flip
                </span>
              </div>
            </div>
            <div className="flashcard-back">
              <BinderRings />
              <div className="card-content">
                <span className="card-label">
                  <Lightbulb size={10} strokeWidth={1.5} />
                  Answer
                </span>
                <p>{card.back}</p>
                {card.back_image && (
                  <div 
                    className="card-image" 
                    onClick={(e) => handleImageClick(e, card.back_image)}
                  >
                    <img src={card.back_image} alt="Answer" />
                  </div>
                )}
                <span className="flip-hint">
                  <RotateCcw size={10} strokeWidth={1.5} />
                  click to flip
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="card-actions">
          {onEdit && (
            <button 
              className="btn btn-ghost btn-edit" 
              onClick={handleEdit}
              title="Edit card"
            >
              <Pencil size={12} strokeWidth={1.5} />
            </button>
          )}
          {onDelete && (
            <button 
              className="btn btn-ghost btn-delete" 
              onClick={(e) => {
                e.stopPropagation()
                onDelete(card.id)
              }}
              title="Delete card"
            >
              <Trash2 size={12} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {showEditModal && (
        <EditCardModal
          card={card}
          onSave={handleSave}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {viewingImage && (
        <div className="image-viewer-overlay" onClick={closeImageViewer}>
          <button className="image-viewer-close" onClick={closeImageViewer}>
            <X size={20} strokeWidth={1.5} />
          </button>
          <img src={viewingImage} alt="Full size" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}

export default Flashcard
