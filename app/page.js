'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Color palette for decks ─────────────────────────────────────────────────
const DECK_COLORS = [
  'linear-gradient(90deg, #EC4899, #8B5CF6)',
  'linear-gradient(90deg, #3B82F6, #06B6D4)',
  'linear-gradient(90deg, #10B981, #3B82F6)',
  'linear-gradient(90deg, #F59E0B, #EF4444)',
  'linear-gradient(90deg, #8B5CF6, #EC4899)',
];

// ─── localStorage helpers ────────────────────────────────────────────────────
function loadDecks() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('flashcard-decks') || '[]');
  } catch { return []; }
}

function saveDecks(decks) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('flashcard-decks', JSON.stringify(decks));
}

function loadStats() {
  if (typeof window === 'undefined') return { studied: 0, easy: 0, medium: 0, hard: 0, sessions: 0 };
  try {
    return JSON.parse(localStorage.getItem('flashcard-stats') || '{"studied":0,"easy":0,"medium":0,"hard":0,"sessions":0}');
  } catch { return { studied: 0, easy: 0, medium: 0, hard: 0, sessions: 0 }; }
}

function saveStats(stats) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('flashcard-stats', JSON.stringify(stats));
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function FlashcardApp() {
  const [tab, setTab] = useState('decks');
  const [decks, setDecks] = useState([]);
  const [stats, setStats] = useState({ studied: 0, easy: 0, medium: 0, hard: 0, sessions: 0 });
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [toast, setToast] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Study state
  const [studyDeck, setStudyDeck] = useState(null);
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Form state
  const [deckName, setDeckName] = useState('');
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');

  useEffect(() => {
    setDecks(loadDecks());
    setStats(loadStats());
    setMounted(true);
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const createDeck = () => {
    if (!deckName.trim()) return;
    const newDeck = {
      id: Date.now().toString(),
      name: deckName.trim(),
      cards: [],
      color: DECK_COLORS[decks.length % DECK_COLORS.length],
      createdAt: new Date().toISOString(),
    };
    const updated = [...decks, newDeck];
    setDecks(updated);
    saveDecks(updated);
    setDeckName('');
    showToast(`Deck "${newDeck.name}" created!`);
  };

  const deleteDeck = (id) => {
    const updated = decks.filter((d) => d.id !== id);
    setDecks(updated);
    saveDecks(updated);
    if (selectedDeck?.id === id) setSelectedDeck(null);
    showToast('Deck deleted');
  };

  const addCard = () => {
    if (!cardFront.trim() || !cardBack.trim() || !selectedDeck) return;
    const updated = decks.map((d) => {
      if (d.id === selectedDeck.id) {
        return { ...d, cards: [...d.cards, { id: Date.now().toString(), front: cardFront.trim(), back: cardBack.trim() }] };
      }
      return d;
    });
    setDecks(updated);
    saveDecks(updated);
    setSelectedDeck(updated.find((d) => d.id === selectedDeck.id));
    setCardFront('');
    setCardBack('');
    showToast('Card added!');
  };

  const deleteCard = (cardId) => {
    const updated = decks.map((d) => {
      if (d.id === selectedDeck.id) {
        return { ...d, cards: d.cards.filter((c) => c.id !== cardId) };
      }
      return d;
    });
    setDecks(updated);
    saveDecks(updated);
    setSelectedDeck(updated.find((d) => d.id === selectedDeck.id));
  };

  const startStudy = (deck) => {
    if (deck.cards.length === 0) { showToast('Add cards first!'); return; }
    const shuffled = [...deck.cards].sort(() => Math.random() - 0.5);
    setStudyDeck({ ...deck, cards: shuffled });
    setStudyIndex(0);
    setFlipped(false);
    setTab('study');
    const s = { ...stats, sessions: stats.sessions + 1 };
    setStats(s);
    saveStats(s);
  };

  const rateCard = (difficulty) => {
    const s = { ...stats, studied: stats.studied + 1, [difficulty]: stats[difficulty] + 1 };
    setStats(s);
    saveStats(s);

    if (studyIndex < studyDeck.cards.length - 1) {
      setStudyIndex(studyIndex + 1);
      setFlipped(false);
    } else {
      showToast('🎉 Deck complete!');
      setStudyDeck(null);
      setTab('stats');
    }
  };

  if (!mounted) return null;

  const totalCards = decks.reduce((sum, d) => sum + d.cards.length, 0);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <span className="header__icon">🃏</span>
        <h1 className="header__title">Flashcard Builder</h1>
        <p className="header__sub">Create, study & master — fully offline</p>
      </header>

      {/* Tabs */}
      <nav className="tabs">
        {['decks', 'study', 'stats'].map((t) => (
          <button key={t} className={`tab ${tab === t ? 'tab--active' : ''}`} onClick={() => setTab(t)}>
            {t === 'decks' ? '📚 Decks' : t === 'study' ? '🧠 Study' : '📊 Stats'}
          </button>
        ))}
      </nav>

      {/* ─── Decks Tab ─── */}
      {tab === 'decks' && !selectedDeck && (
        <>
          <div className="create-form">
            <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Create New Deck</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                className="form-input"
                placeholder="e.g. Biology Chapter 3"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createDeck()}
              />
              <button className="btn btn--primary" onClick={createDeck}>+ Create</button>
            </div>
          </div>

          {decks.length === 0 ? (
            <div className="empty">
              <div className="empty__icon">📂</div>
              <p className="empty__text">No decks yet. Create your first deck above!</p>
            </div>
          ) : (
            <div className="deck-grid">
              {decks.map((deck) => (
                <div key={deck.id} className="deck-card" onClick={() => setSelectedDeck(deck)}>
                  <div className="deck-card__color" style={{ background: deck.color }} />
                  <div className="deck-card__name">{deck.name}</div>
                  <div className="deck-card__count">{deck.cards.length} card{deck.cards.length !== 1 ? 's' : ''}</div>
                  <div className="deck-card__actions">
                    <button className="btn btn--secondary btn--sm" onClick={(e) => { e.stopPropagation(); startStudy(deck); }}>
                      ▶ Study
                    </button>
                    <button className="btn btn--danger btn--sm" onClick={(e) => { e.stopPropagation(); deleteDeck(deck.id); }}>
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── Deck Detail (add/view cards) ─── */}
      {tab === 'decks' && selectedDeck && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <button className="btn btn--secondary btn--sm" onClick={() => setSelectedDeck(null)}>← Back</button>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>{selectedDeck.name}</h2>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{selectedDeck.cards.length} cards</span>
          </div>

          <div className="create-form">
            <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Add New Card</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Front (Question)</label>
                <input className="form-input" placeholder="What is photosynthesis?" value={cardFront} onChange={(e) => setCardFront(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Back (Answer)</label>
                <input className="form-input" placeholder="The process by which..." value={cardBack} onChange={(e) => setCardBack(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCard()} />
              </div>
            </div>
            <button className="btn btn--primary" onClick={addCard}>+ Add Card</button>
          </div>

          {selectedDeck.cards.length === 0 ? (
            <div className="empty">
              <div className="empty__icon">🃏</div>
              <p className="empty__text">No cards in this deck yet. Add some above!</p>
            </div>
          ) : (
            <div className="card-list">
              {selectedDeck.cards.map((card) => (
                <div key={card.id} className="flashcard-item">
                  <span className="flashcard-item__front">{card.front}</span>
                  <span className="flashcard-item__divider" />
                  <span className="flashcard-item__back">{card.back}</span>
                  <button className="btn btn--danger btn--sm" onClick={() => deleteCard(card.id)}>✕</button>
                </div>
              ))}
            </div>
          )}

          {selectedDeck.cards.length > 0 && (
            <button className="btn btn--primary" onClick={() => startStudy(selectedDeck)} style={{ marginTop: 12 }}>
              ▶ Study This Deck ({selectedDeck.cards.length} cards)
            </button>
          )}
        </>
      )}

      {/* ─── Study Tab ─── */}
      {tab === 'study' && !studyDeck && (
        <>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Choose a Deck to Study</h2>
          {decks.length === 0 ? (
            <div className="empty">
              <div className="empty__icon">📚</div>
              <p className="empty__text">Create a deck with cards first!</p>
              <button className="btn btn--primary" onClick={() => setTab('decks')}>Go to Decks</button>
            </div>
          ) : (
            <div className="deck-grid">
              {decks.filter((d) => d.cards.length > 0).map((deck) => (
                <div key={deck.id} className="deck-card" onClick={() => startStudy(deck)}>
                  <div className="deck-card__color" style={{ background: deck.color }} />
                  <div className="deck-card__name">{deck.name}</div>
                  <div className="deck-card__count">{deck.cards.length} cards — tap to study</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'study' && studyDeck && (
        <div className="study-area">
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>
            {studyDeck.name} — Card {studyIndex + 1} of {studyDeck.cards.length}
          </div>

          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${((studyIndex + 1) / studyDeck.cards.length) * 100}%` }} />
          </div>

          <div className="study-card" onClick={() => setFlipped(!flipped)}>
            <div className={`study-card__inner ${flipped ? 'study-card__inner--flipped' : ''}`}>
              <div className="study-card__face">
                <span className="study-card__label">Question</span>
                <span className="study-card__text">{studyDeck.cards[studyIndex].front}</span>
                <span className="study-card__hint">Click to reveal answer</span>
              </div>
              <div className="study-card__face study-card__back-face">
                <span className="study-card__label">Answer</span>
                <span className="study-card__text">{studyDeck.cards[studyIndex].back}</span>
                <span className="study-card__hint">Rate your confidence below</span>
              </div>
            </div>
          </div>

          {flipped && (
            <div className="study-controls">
              <button className="study-btn study-btn--hard" onClick={() => rateCard('hard')}>😰 Hard</button>
              <button className="study-btn study-btn--medium" onClick={() => rateCard('medium')}>🤔 Medium</button>
              <button className="study-btn study-btn--easy" onClick={() => rateCard('easy')}>😎 Easy</button>
            </div>
          )}

          <button className="btn btn--secondary btn--sm" onClick={() => { setStudyDeck(null); setTab('decks'); }}>
            ✕ End Session
          </button>
        </div>
      )}

      {/* ─── Stats Tab ─── */}
      {tab === 'stats' && (
        <>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>📊 Your Progress</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card__value">{decks.length}</div>
              <div className="stat-card__label">Decks</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{totalCards}</div>
              <div className="stat-card__label">Total Cards</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{stats.studied}</div>
              <div className="stat-card__label">Cards Studied</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{stats.sessions}</div>
              <div className="stat-card__label">Sessions</div>
            </div>
          </div>

          <div className="create-form">
            <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Confidence Breakdown</h3>
            <div className="stats-grid" style={{ marginBottom: 0 }}>
              <div className="stat-card">
                <div className="stat-card__value" style={{ background: 'linear-gradient(135deg, #10B981, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stats.easy}</div>
                <div className="stat-card__label">😎 Easy</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__value" style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stats.medium}</div>
                <div className="stat-card__label">🤔 Medium</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__value" style={{ background: 'linear-gradient(135deg, #EF4444, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stats.hard}</div>
                <div className="stat-card__label">😰 Hard</div>
              </div>
            </div>
          </div>

          {stats.studied > 0 && (
            <button className="btn btn--danger" style={{ marginTop: 24 }} onClick={() => {
              const s = { studied: 0, easy: 0, medium: 0, hard: 0, sessions: 0 };
              setStats(s);
              saveStats(s);
              showToast('Stats reset!');
            }}>
              🗑 Reset Stats
            </button>
          )}
        </>
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
