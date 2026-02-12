import { useState, useEffect } from 'react'
import { Plus, FileText, Layers, BookOpen, PenLine, Brain, Trash2, ArrowLeft, FolderOpen, Edit2, BarChart3, LogOut, Loader, ClipboardCheck, Copy, Globe, Lock, Search, Users } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { api } from './api/client'
import AuthForm from './components/AuthForm'
import FlashcardForm from './components/FlashcardForm'
import Flashcard from './components/Flashcard'
import TextParser from './components/TextParser'
import StudyMode from './components/StudyMode'
import WriteMode from './components/WriteMode'
import LearnMode from './components/LearnMode'
import StatsView from './components/StatsView'
import TestMode from './components/TestMode'

function Logo() {
  return (
    <div className="logo">
      <div className="logo-grid">
        <span className="logo-dot"></span>
        <span className="logo-dot"></span>
        <span className="logo-dot action"></span>
        <span className="logo-dot arrow"></span>
      </div>
    </div>
  )
}

function App() {
  const { user, loading: authLoading, logout } = useAuth()
  
  const [sets, setSets] = useState([])
  const [currentSetId, setCurrentSetId] = useState(null)
  const [currentSetData, setCurrentSetData] = useState(null)
  const [activeTab, setActiveTab] = useState('create')
  const [studyMode, setStudyMode] = useState(null)
  const [studySession, setStudySession] = useState(null)
  const [isCreatingSet, setIsCreatingSet] = useState(false)
  const [newSetName, setNewSetName] = useState('')
  const [editingSetId, setEditingSetId] = useState(null)
  const [editSetName, setEditSetName] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPublicSets, setShowPublicSets] = useState(false)
  const [publicSets, setPublicSets] = useState([])
  const [publicSearch, setPublicSearch] = useState('')
  const [loadingPublic, setLoadingPublic] = useState(false)
  const [viewingPublicSet, setViewingPublicSet] = useState(null)

  // Load sets when user logs in
  useEffect(() => {
    if (user) {
      loadSets()
    } else {
      setSets([])
      setCurrentSetId(null)
      setCurrentSetData(null)
    }
  }, [user])

  // Load set details when set is selected
  useEffect(() => {
    if (currentSetId) {
      loadSetDetails(currentSetId)
    } else {
      setCurrentSetData(null)
    }
  }, [currentSetId])

  const loadSets = async () => {
    try {
      setLoading(true)
      const data = await api.getSets()
      setSets(data)
    } catch (err) {
      console.error('Failed to load sets:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSetDetails = async (id) => {
    try {
      setLoading(true)
      const data = await api.getSet(id)
      setCurrentSetData(data)
    } catch (err) {
      console.error('Failed to load set:', err)
    } finally {
      setLoading(false)
    }
  }

  const cards = currentSetData?.cards || []
  const studyHistory = currentSetData?.studyHistory || []

  const createSet = async () => {
    if (newSetName.trim()) {
      try {
        const newSet = await api.createSet(newSetName.trim())
        setSets([newSet, ...sets])
        setCurrentSetId(newSet.id)
        setNewSetName('')
        setIsCreatingSet(false)
      } catch (err) {
        console.error('Failed to create set:', err)
      }
    }
  }

  const deleteSet = async (id) => {
    if (window.confirm('Are you sure you want to delete this set?')) {
      try {
        await api.deleteSet(id)
        setSets(sets.filter(s => s.id !== id))
        if (currentSetId === id) {
          setCurrentSetId(null)
        }
      } catch (err) {
        console.error('Failed to delete set:', err)
      }
    }
  }

  const duplicateSet = async (id) => {
    try {
      const newSet = await api.duplicateSet(id)
      setSets([newSet, ...sets])
    } catch (err) {
      console.error('Failed to duplicate set:', err)
    }
  }

  const toggleSetVisibility = async (id, isPublic) => {
    try {
      const updated = await api.setVisibility(id, isPublic)
      setSets(sets.map(s => s.id === id ? { ...s, is_public: updated.is_public } : s))
      if (currentSetData?.id === id) {
        setCurrentSetData({ ...currentSetData, is_public: updated.is_public })
      }
    } catch (err) {
      console.error('Failed to update visibility:', err)
    }
  }

  const loadPublicSets = async (search = '') => {
    setLoadingPublic(true)
    try {
      const data = await api.getPublicSets(search)
      setPublicSets(data)
    } catch (err) {
      console.error('Failed to load public sets:', err)
    } finally {
      setLoadingPublic(false)
    }
  }

  const viewPublicSet = async (id) => {
    try {
      const data = await api.getPublicSet(id)
      setViewingPublicSet(data)
    } catch (err) {
      console.error('Failed to load public set:', err)
    }
  }

  const copyPublicSet = async (id) => {
    try {
      const newSet = await api.copyPublicSet(id)
      setSets([newSet, ...sets])
      setShowPublicSets(false)
      setViewingPublicSet(null)
      setCurrentSetId(newSet.id)
    } catch (err) {
      console.error('Failed to copy set:', err)
    }
  }

  const renameSet = async (id) => {
    if (editSetName.trim()) {
      try {
        const updated = await api.updateSet(id, editSetName.trim())
        setSets(sets.map(s => s.id === id ? { ...s, name: updated.name } : s))
        if (currentSetData?.id === id) {
          setCurrentSetData({ ...currentSetData, name: updated.name })
        }
        setEditingSetId(null)
        setEditSetName('')
      } catch (err) {
        console.error('Failed to rename set:', err)
      }
    }
  }

  const addCard = async (card) => {
    try {
      const newCard = await api.createCard(currentSetId, card.front, card.back)
      setCurrentSetData({
        ...currentSetData,
        cards: [...currentSetData.cards, newCard]
      })
      // Update count in sets list
      setSets(sets.map(s => 
        s.id === currentSetId ? { ...s, card_count: (s.card_count || 0) + 1 } : s
      ))
    } catch (err) {
      console.error('Failed to add card:', err)
    }
  }

  const importCards = async (newCards) => {
    try {
      const created = await api.createCardsBulk(currentSetId, newCards)
      setCurrentSetData({
        ...currentSetData,
        cards: [...currentSetData.cards, ...created]
      })
      // Update count in sets list
      setSets(sets.map(s => 
        s.id === currentSetId ? { ...s, card_count: (s.card_count || 0) + created.length } : s
      ))
    } catch (err) {
      console.error('Failed to import cards:', err)
    }
  }

  const deleteCard = async (cardId) => {
    try {
      await api.deleteCard(cardId)
      setCurrentSetData({
        ...currentSetData,
        cards: currentSetData.cards.filter(c => c.id !== cardId)
      })
      // Update count in sets list
      setSets(sets.map(s => 
        s.id === currentSetId ? { ...s, card_count: Math.max(0, (s.card_count || 1) - 1) } : s
      ))
    } catch (err) {
      console.error('Failed to delete card:', err)
    }
  }

  const editCard = async (cardId, data) => {
    try {
      const updated = await api.updateCard(cardId, data)
      setCurrentSetData({
        ...currentSetData,
        cards: currentSetData.cards.map(c => c.id === cardId ? updated : c)
      })
    } catch (err) {
      console.error('Failed to edit card:', err)
      throw err
    }
  }

  const clearAllCards = async () => {
    if (window.confirm('Are you sure you want to delete all cards in this set?')) {
      try {
        // Delete each card
        for (const card of currentSetData.cards) {
          await api.deleteCard(card.id)
        }
        setCurrentSetData({
          ...currentSetData,
          cards: []
        })
        setSets(sets.map(s => 
          s.id === currentSetId ? { ...s, card_count: 0 } : s
        ))
      } catch (err) {
        console.error('Failed to clear cards:', err)
      }
    }
  }

  const startStudyMode = async (mode) => {
    try {
      const session = await api.startSession(currentSetId, mode)
      setStudySession(session)
      setStudyMode(mode)
    } catch (err) {
      console.error('Failed to start study session:', err)
      // Fall back to local-only mode
      setStudyMode(mode)
    }
  }

  const exitStudy = async (results) => {
    if (results && results.length > 0 && studySession) {
      try {
        await api.recordResults(studySession.id, results.map(r => ({
          card_id: r.cardId,
          correct: r.correct
        })))
        // Reload set data to get updated study history
        await loadSetDetails(currentSetId)
      } catch (err) {
        console.error('Failed to record results:', err)
      }
    }
    setStudyMode(null)
    setStudySession(null)
  }

  // Show loading state
  if (authLoading) {
    return (
      <div className="app loading-screen">
        <Loader size={24} className="spinner" />
      </div>
    )
  }

  // Show auth form if not logged in
  if (!user) {
    return <AuthForm />
  }

  // Study modes
  if (studyMode === 'flashcards') {
    return <StudyMode cards={cards} onExit={() => exitStudy(null)} />
  }
  if (studyMode === 'write') {
    return <WriteMode cards={cards} onExit={exitStudy} />
  }
  if (studyMode === 'learn') {
    return <LearnMode cards={cards} onExit={exitStudy} studyHistory={studyHistory} />
  }
  if (studyMode === 'test') {
    return <TestMode cards={cards} onExit={exitStudy} />
  }

  // Viewing a public set
  if (viewingPublicSet) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-left">
            <button className="btn btn-ghost back-btn" onClick={() => setViewingPublicSet(null)}>
              <ArrowLeft size={14} strokeWidth={1.5} />
              Back
            </button>
          </div>
          <div className="header-right">
            <button className="btn btn-primary" onClick={() => copyPublicSet(viewingPublicSet.id)}>
              <Copy size={14} strokeWidth={1.5} />
              Copy to My Sets
            </button>
          </div>
        </header>

        <div className="public-set-view">
          <div className="public-set-header">
            <h2>{viewingPublicSet.name}</h2>
            {viewingPublicSet.description && (
              <p className="public-set-description">{viewingPublicSet.description}</p>
            )}
            <div className="public-set-author">
              {viewingPublicSet.author_picture && (
                <img src={viewingPublicSet.author_picture} alt="" className="author-avatar" />
              )}
              <span>by {viewingPublicSet.author_name}</span>
            </div>
          </div>

          <div className="public-cards-list">
            {viewingPublicSet.cards?.map((card, idx) => (
              <div key={card.id} className="public-card-item">
                <span className="card-number">{idx + 1}</span>
                <div className="card-content">
                  <div className="card-front">{card.front}</div>
                  <div className="card-back">{card.back}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Browse public sets view
  if (showPublicSets) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-left">
            <button className="btn btn-ghost back-btn" onClick={() => {
              setShowPublicSets(false)
              setPublicSets([])
              setPublicSearch('')
            }}>
              <ArrowLeft size={14} strokeWidth={1.5} />
              Back
            </button>
            <h1>Browse Public Sets</h1>
          </div>
        </header>

        <div className="public-sets-search">
          <div className="search-input-wrapper">
            <Search size={16} strokeWidth={1.5} />
            <input
              type="text"
              value={publicSearch}
              onChange={(e) => setPublicSearch(e.target.value)}
              placeholder="Search public sets..."
              onKeyDown={(e) => e.key === 'Enter' && loadPublicSets(publicSearch)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => loadPublicSets(publicSearch)}>
            Search
          </button>
        </div>

        <div className="sets-grid">
          {loadingPublic ? (
            <div className="empty-state">
              <Loader size={24} className="spinner" />
              <p>Loading...</p>
            </div>
          ) : publicSets.length === 0 ? (
            <div className="empty-state">
              <Users size={32} strokeWidth={1} />
              <p>No public sets found</p>
              <p className="empty-hint">Try searching for something or check back later</p>
            </div>
          ) : (
            publicSets.map(set => (
              <div key={set.id} className="set-card public" onClick={() => viewPublicSet(set.id)}>
                <div className="set-info">
                  <h3>{set.name}</h3>
                  <span className="set-count">{set.card_count || 0} cards</span>
                  <div className="set-author">
                    {set.author_picture && (
                      <img src={set.author_picture} alt="" className="author-avatar-small" />
                    )}
                    <span className="author-name">{set.author_name}</span>
                  </div>
                </div>
                <div className="set-actions">
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={(e) => {
                      e.stopPropagation()
                      copyPublicSet(set.id)
                    }}
                  >
                    <Copy size={12} strokeWidth={1.5} />
                    Copy
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // Set list view (no set selected)
  if (!currentSetId) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-left">
            <Logo />
            <h1>Flashcard Studio</h1>
          </div>
          <div className="header-right">
            <div className="user-info">
              {user.picture && (
                <img src={user.picture} alt="" className="user-avatar" />
              )}
              <span className="user-email">{user.name || user.email}</span>
            </div>
            <button className="btn btn-ghost" onClick={logout}>
              <LogOut size={14} strokeWidth={1.5} />
            </button>
          </div>
        </header>

        <div className="sets-header">
          <h2>Your Sets</h2>
          <div className="sets-header-actions">
            <button className="btn btn-secondary" onClick={() => {
              setShowPublicSets(true)
              loadPublicSets()
            }}>
              <Globe size={14} strokeWidth={1.5} />
              Browse Public
            </button>
            <button className="btn btn-primary" onClick={() => setIsCreatingSet(true)}>
              <Plus size={14} strokeWidth={1.5} />
              New Set
            </button>
          </div>
        </div>

        {isCreatingSet && (
          <div className="create-set-form">
            <input
              type="text"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              placeholder="Set name..."
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && createSet()}
            />
            <div className="create-set-actions">
              <button className="btn btn-primary" onClick={createSet}>
                Create
              </button>
              <button className="btn btn-secondary" onClick={() => {
                setIsCreatingSet(false)
                setNewSetName('')
              }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="sets-grid">
          {loading ? (
            <div className="empty-state">
              <Loader size={24} className="spinner" />
              <p>Loading...</p>
            </div>
          ) : sets.length === 0 && !isCreatingSet ? (
            <div className="empty-state">
              <FolderOpen size={32} strokeWidth={1} />
              <p>No flashcard sets yet</p>
              <p className="empty-hint">Create your first set to get started</p>
            </div>
          ) : (
            sets.map(set => (
              <div key={set.id} className="set-card">
                {editingSetId === set.id ? (
                  <div className="set-edit-form">
                    <input
                      type="text"
                      value={editSetName}
                      onChange={(e) => setEditSetName(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') renameSet(set.id)
                        if (e.key === 'Escape') {
                          setEditingSetId(null)
                          setEditSetName('')
                        }
                      }}
                    />
                    <button className="btn btn-primary" onClick={() => renameSet(set.id)}>
                      Save
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="set-info" onClick={() => setCurrentSetId(set.id)}>
                      <h3>
                        {set.name}
                        {set.is_public && (
                          <span className="public-badge" title="Public">
                            <Globe size={12} strokeWidth={1.5} />
                          </span>
                        )}
                      </h3>
                      <span className="set-count">{set.card_count || 0} cards</span>
                    </div>
                    <div className="set-actions">
                      <button 
                        className="btn btn-ghost" 
                        title="Edit"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingSetId(set.id)
                          setEditSetName(set.name)
                        }}
                      >
                        <Edit2 size={14} strokeWidth={1.5} />
                      </button>
                      <button 
                        className="btn btn-ghost" 
                        title="Duplicate"
                        onClick={(e) => {
                          e.stopPropagation()
                          duplicateSet(set.id)
                        }}
                      >
                        <Copy size={14} strokeWidth={1.5} />
                      </button>
                      <button 
                        className="btn btn-ghost" 
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSet(set.id)
                        }}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // Set detail view
  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <button className="btn btn-ghost back-btn" onClick={() => setCurrentSetId(null)}>
            <ArrowLeft size={14} strokeWidth={1.5} />
            All Sets
          </button>
          {editingSetId === currentSetId ? (
            <input
              type="text"
              className="set-name-edit"
              value={editSetName}
              onChange={(e) => setEditSetName(e.target.value)}
              onBlur={() => {
                if (editSetName.trim() && editSetName !== currentSetData?.name) {
                  renameSet(currentSetId)
                } else {
                  setEditingSetId(null)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.target.blur()
                } else if (e.key === 'Escape') {
                  setEditingSetId(null)
                }
              }}
              autoFocus
            />
          ) : (
            <h1 
              className="editable-title"
              onClick={() => {
                setEditingSetId(currentSetId)
                setEditSetName(currentSetData?.name || '')
              }}
              title="Click to edit"
            >
              {currentSetData?.name}
              <Edit2 size={14} strokeWidth={1.5} className="edit-icon" />
            </h1>
          )}
        </div>
        <div className="header-right">
          <button 
            className={`btn visibility-toggle ${currentSetData?.is_public ? 'public' : 'private'}`}
            onClick={() => toggleSetVisibility(currentSetId, !currentSetData?.is_public)}
            title={currentSetData?.is_public ? 'Public - Click to make private' : 'Private - Click to make public'}
          >
            {currentSetData?.is_public ? (
              <>
                <Globe size={14} strokeWidth={1.5} />
                Public
              </>
            ) : (
              <>
                <Lock size={14} strokeWidth={1.5} />
                Private
              </>
            )}
          </button>
          <button className="btn btn-ghost" onClick={logout}>
            <LogOut size={14} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="empty-state">
          <Loader size={24} className="spinner" />
          <p>Loading...</p>
        </div>
      ) : (
        <>
          {cards.length > 0 && (
            <div className="study-options">
              <h3>Study Modes</h3>
              <div className="study-buttons">
                <button 
                  className="study-option-btn" 
                  onClick={() => startStudyMode('flashcards')}
                >
                  <span className="option-icon"><Layers size={20} strokeWidth={1.5} /></span>
                  <span className="option-name">Flashcards</span>
                  <span className="option-desc">Flip through cards</span>
                </button>
                <button 
                  className="study-option-btn" 
                  onClick={() => startStudyMode('learn')}
                >
                  <span className="option-icon"><Brain size={20} strokeWidth={1.5} /></span>
                  <span className="option-name">Learn</span>
                  <span className="option-desc">Multiple choice</span>
                </button>
                <button 
                  className="study-option-btn" 
                  onClick={() => startStudyMode('write')}
                >
                  <span className="option-icon"><PenLine size={20} strokeWidth={1.5} /></span>
                  <span className="option-name">Write</span>
                  <span className="option-desc">Type answers</span>
                </button>
                <button 
                  className="study-option-btn" 
                  onClick={() => startStudyMode('test')}
                >
                  <span className="option-icon"><ClipboardCheck size={20} strokeWidth={1.5} /></span>
                  <span className="option-name">Test</span>
                  <span className="option-desc">Timed quiz</span>
                </button>
              </div>
            </div>
          )}

          <div className="stats-bar">
            <div className="stat">
              <span className="stat-number">{cards.length}</span>
              <span className="stat-label">Cards</span>
            </div>
            {cards.length > 0 && (
              <button className="btn btn-ghost" onClick={clearAllCards}>
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            )}
          </div>

          <nav className="tabs">
            <button 
              className={`tab ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              <Plus size={14} strokeWidth={1.5} />
              Create
            </button>
            <button 
              className={`tab ${activeTab === 'import' ? 'active' : ''}`}
              onClick={() => setActiveTab('import')}
            >
              <FileText size={14} strokeWidth={1.5} />
              Import
            </button>
            <button 
              className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
              onClick={() => setActiveTab('browse')}
            >
              <BookOpen size={14} strokeWidth={1.5} />
              Browse
            </button>
            <button 
              className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              <BarChart3 size={14} strokeWidth={1.5} />
              Stats
            </button>
          </nav>

          <main className="content">
            {activeTab === 'create' && (
              <FlashcardForm onAddCard={addCard} />
            )}

            {activeTab === 'import' && (
              <TextParser onImport={importCards} />
            )}

            {activeTab === 'browse' && (
              <div className="card-grid">
                {cards.length === 0 ? (
                  <div className="empty-state">
                    <Layers size={32} strokeWidth={1} />
                    <p>No flashcards yet</p>
                    <p className="empty-hint">Create your first card or import from text</p>
                  </div>
                ) : (
                  cards.map(card => (
                    <Flashcard 
                      key={card.id} 
                      card={card} 
                      onDelete={deleteCard}
                      onEdit={editCard}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <StatsView cards={cards} studyHistory={studyHistory} />
            )}
          </main>
        </>
      )}
    </div>
  )
}

export default App
