import { useState, useRef } from 'react'
import { X, Image, Trash2, Upload } from 'lucide-react'

function EditCardModal({ card, onSave, onClose }) {
  const [front, setFront] = useState(card.front)
  const [back, setBack] = useState(card.back)
  const [frontImage, setFrontImage] = useState(card.front_image || null)
  const [backImage, setBackImage] = useState(card.back_image || null)
  const [saving, setSaving] = useState(false)
  
  const frontInputRef = useRef(null)
  const backInputRef = useRef(null)

  const handleImageUpload = (e, side) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target.result
      if (side === 'front') {
        setFrontImage(base64)
      } else {
        setBackImage(base64)
      }
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (side) => {
    if (side === 'front') {
      setFrontImage(null)
    } else {
      setBackImage(null)
    }
  }

  const handleSave = async () => {
    if (!front.trim() || !back.trim()) {
      alert('Question and answer are required')
      return
    }

    setSaving(true)
    try {
      await onSave({
        front: front.trim(),
        back: back.trim(),
        front_image: frontImage,
        back_image: backImage,
      })
      onClose()
    } catch (err) {
      console.error('Failed to save:', err)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Flashcard</h2>
          <button className="btn btn-ghost" onClick={onClose}>
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="modal-body">
          <div className="edit-field">
            <label>Question (Front)</label>
            <textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              rows={3}
              placeholder="Enter question..."
            />
            
            <div className="image-upload-section">
              {frontImage ? (
                <div className="image-preview">
                  <img src={frontImage} alt="Front" />
                  <button 
                    className="btn btn-ghost remove-image" 
                    onClick={() => removeImage('front')}
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              ) : (
                <button 
                  className="btn btn-secondary image-upload-btn"
                  onClick={() => frontInputRef.current?.click()}
                >
                  <Image size={14} strokeWidth={1.5} />
                  Add Image
                </button>
              )}
              <input
                ref={frontInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'front')}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className="edit-field">
            <label>Answer (Back)</label>
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={3}
              placeholder="Enter answer..."
            />
            
            <div className="image-upload-section">
              {backImage ? (
                <div className="image-preview">
                  <img src={backImage} alt="Back" />
                  <button 
                    className="btn btn-ghost remove-image" 
                    onClick={() => removeImage('back')}
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              ) : (
                <button 
                  className="btn btn-secondary image-upload-btn"
                  onClick={() => backInputRef.current?.click()}
                >
                  <Image size={14} strokeWidth={1.5} />
                  Add Image
                </button>
              )}
              <input
                ref={backInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'back')}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditCardModal
