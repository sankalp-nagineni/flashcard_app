import { useState } from 'react'
import { FileText, Upload } from 'lucide-react'

function TextParser({ onImport }) {
  const [text, setText] = useState('')
  const [delimiter, setDelimiter] = useState('|')

  const handleParse = () => {
    if (!text.trim()) return

    const lines = text.trim().split('\n').filter(line => line.trim())
    const cards = []

    lines.forEach(line => {
      const parts = line.split(delimiter)
      if (parts.length >= 2) {
        cards.push({
          front: parts[0].trim(),
          back: parts.slice(1).join(delimiter).trim(),
          id: Date.now() + Math.random()
        })
      }
    })

    if (cards.length > 0) {
      onImport(cards)
      setText('')
    }
  }

  return (
    <div className="text-parser">
      <h2>
        <FileText size={14} strokeWidth={1.5} />
        Import Text
      </h2>
      <p className="parser-hint">
        Paste your flashcards with questions and answers separated by the delimiter.
        One flashcard per line.
      </p>
      <p className="parser-hint ai-tip">
        If you have any notes, ask any AI model to "put notes in pipe format" and then paste them here!
      </p>
      <div className="delimiter-select">
        <label>Delimiter</label>
        <select value={delimiter} onChange={(e) => setDelimiter(e.target.value)}>
          <option value="|">Pipe ( | )</option>
          <option value="\t">Tab</option>
          <option value="::">Double Colon ( :: )</option>
          <option value=";">Semicolon ( ; )</option>
        </select>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Example:\nCapital of France?${delimiter} Paris\nWhat is 2 + 2?${delimiter} 4`}
        rows={8}
      />
      <button className="btn btn-primary" onClick={handleParse} style={{ marginTop: '1rem' }}>
        <Upload size={14} strokeWidth={1.5} />
        Import
      </button>
    </div>
  )
}

export default TextParser
