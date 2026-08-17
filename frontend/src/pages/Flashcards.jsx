import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';

export default function Flashcards() {
  const { noteId } = useParams();
  
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [note, setNote] = useState(null);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  
  // Flashcard settings
  const [numCards, setNumCards] = useState(10);
  const [includeDefinitions, setIncludeDefinitions] = useState(true);
  const [includeConcepts, setIncludeConcepts] = useState(true);

  useEffect(() => {
    fetchNote();
  }, [noteId]);

  const fetchNote = async () => {
    try {
      const response = await api.get(`/notes/${noteId}`);
      setNote(response.data);
    } catch (error) {
      console.error('Error fetching note:', error);
    }
  };

  const generateFlashcards = async () => {
    setGenerating(true);
    try {
      const response = await api.post('/flashcards/generate', {
        note_id: noteId,
        num_cards: numCards,
        include_definitions: includeDefinitions,
        include_concepts: includeConcepts
      });
      
      setFlashcardSet(response.data);
      setCurrentCard(0);
      setIsFlipped(false);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      alert('Failed to generate flashcards. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    if (currentCard < flashcardSet.cards.length - 1) {
      setCurrentCard(currentCard + 1);
      setIsFlipped(false);
    }
  };

  const previousCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setIsFlipped(false);
    }
  };

  const rateConfidence = async (confidence) => {
    try {
      await api.post('/flashcards/review', {
        set_id: flashcardSet.set_id,
        card_index: currentCard,
        confidence: confidence,
        time_spent: 0
      });
      
      // Move to next card after rating
      nextCard();
    } catch (error) {
      console.error('Error recording review:', error);
    }
  };

  const fetchStats = async () => {
    if (!flashcardSet) return;
    
    try {
      const response = await api.get(`/flashcards/${flashcardSet.set_id}/stats`);
      setStats(response.data);
      setShowStats(true);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Flashcard setup screen
  if (!flashcardSet && !generating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to="/notes" className="text-blue-600 hover:text-blue-700 mb-6 inline-flex items-center">
            ← Back to Notes
          </Link>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 mt-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Generate Flashcards</h1>
            <p className="text-gray-600 mb-8">
              {note ? `Create flashcards from: ${note.filename}` : 'Loading...'}
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Cards
                </label>
                <select
                  value={numCards}
                  onChange={(e) => setNumCards(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={5}>5 cards (Quick Review)</option>
                  <option value={10}>10 cards (Standard)</option>
                  <option value={15}>15 cards (Comprehensive)</option>
                  <option value={20}>20 cards (Full Deck)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Include
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeDefinitions}
                      onChange={(e) => setIncludeDefinitions(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">Key Terms & Definitions</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeConcepts}
                      onChange={(e) => setIncludeConcepts(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">Important Concepts</span>
                  </label>
                </div>
              </div>

              <button
                onClick={generateFlashcards}
                disabled={!includeDefinitions && !includeConcepts}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Flashcards 🎴
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Generating screen
  if (generating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Generating Flashcards...</h2>
          <p className="text-gray-600">This may take 30-60 seconds</p>
          <p className="text-sm text-gray-500 mt-2">🤖 AI is extracting key concepts and definitions</p>
        </div>
      </div>
    );
  }

  // Stats modal
  if (showStats && stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-center mb-8">Your Progress 📊</h1>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                <div className="text-4xl font-bold text-blue-600 mb-2">{stats.reviewed}</div>
                <div className="text-sm text-gray-600">Cards Reviewed</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                <div className="text-4xl font-bold text-green-600 mb-2">{stats.mastered}</div>
                <div className="text-sm text-gray-600">Mastered</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl">
                <div className="text-4xl font-bold text-yellow-600 mb-2">{stats.needs_review}</div>
                <div className="text-sm text-gray-600">Needs Review</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                <div className="text-4xl font-bold text-purple-600 mb-2">{stats.average_confidence.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Avg. Confidence</div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowStats(false);
                  setCurrentCard(0);
                  setIsFlipped(false);
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
              >
                Continue Studying
              </button>
              <button
                onClick={() => {
                  setFlashcardSet(null);
                  setShowStats(false);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                New Set
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Flashcard study screen
  const card = flashcardSet.cards[currentCard];
  const progress = ((currentCard + 1) / flashcardSet.cards.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link to="/notes" className="text-blue-600 hover:text-blue-700">
            ← Back
          </Link>
          <button
            onClick={fetchStats}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View Stats 📊
          </button>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Card {currentCard + 1} of {flashcardSet.cards.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Flashcard */}
        <div
          className="relative h-96 mb-6 cursor-pointer perspective"
          onClick={flipCard}
        >
          <div
            className={`absolute w-full h-full transition-transform duration-500 preserve-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front */}
            <div
              className="absolute w-full h-full bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center backface-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="text-sm text-blue-600 font-medium mb-4">FRONT</div>
              <h2 className="text-3xl font-bold text-gray-800 text-center mb-4">
                {card.front}
              </h2>
              <p className="text-gray-400 text-sm mt-auto">Click to flip</p>
            </div>

            {/* Back */}
            <div
              className="absolute w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center backface-hidden rotate-y-180"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="text-sm text-blue-200 font-medium mb-4">BACK</div>
              <p className="text-xl text-white text-center mb-4">
                {card.back}
              </p>
              {card.page_reference && (
                <p className="text-sm text-blue-200 mt-auto">
                  📄 Page {card.page_reference}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Confidence Rating (only show when flipped) */}
        {isFlipped && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fadeIn">
            <p className="text-center text-gray-700 font-medium mb-4">
              How well did you know this?
            </p>
            <div className="grid grid-cols-5 gap-3">
              {[
                { value: 1, label: '😰', text: 'Again' },
                { value: 2, label: '😕', text: 'Hard' },
                { value: 3, label: '😐', text: 'Good' },
                { value: 4, label: '😊', text: 'Easy' },
                { value: 5, label: '🎯', text: 'Perfect' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => rateConfidence(option.value)}
                  className="flex flex-col items-center p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <span className="text-2xl mb-1">{option.label}</span>
                  <span className="text-xs text-gray-600">{option.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={previousCard}
            disabled={currentCard === 0}
            className="flex-1 px-6 py-3 rounded-lg font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            ← Previous
          </button>
          
          <button
            onClick={flipCard}
            className="px-8 py-3 rounded-lg font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
          >
            Flip Card 🔄
          </button>

          <button
            onClick={nextCard}
            disabled={currentCard === flashcardSet.cards.length - 1}
            className="flex-1 px-6 py-3 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
        </div>

        {/* Difficulty badge */}
        <div className="mt-4 text-center">
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
            card.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
            card.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {card.difficulty.charAt(0).toUpperCase() + card.difficulty.slice(1)} Difficulty
          </span>
        </div>
      </div>

      <style>{`
        .perspective { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}
