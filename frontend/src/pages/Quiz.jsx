import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

export default function Quiz() {
  const { noteId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [note, setNote] = useState(null);
  
  // Quiz settings
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');

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

  const generateQuiz = async () => {
    setGenerating(true);
    try {
      const response = await api.post('/quiz/generate', {
        note_id: noteId,
        num_questions: numQuestions,
        difficulty: difficulty
      });
      
      setQuiz(response.data);
      setSelectedAnswers(new Array(response.data.questions.length).fill(-1));
      setCurrentQuestion(0);
      setShowResults(false);
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Failed to generate quiz. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const selectAnswer = (optionIndex) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitQuiz = async () => {
    // Check if all questions are answered
    if (selectedAnswers.includes(-1)) {
      if (!confirm('You haven\'t answered all questions. Submit anyway?')) {
        return;
      }
    }

    setLoading(true);
    try {
      const response = await api.post('/quiz/submit', {
        quiz_id: quiz.quiz_id,
        answers: selectedAnswers
      });
      
      setResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quiz setup screen
  if (!quiz && !generating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to="/notes" className="text-purple-600 hover:text-purple-700 mb-6 inline-flex items-center">
            ← Back to Notes
          </Link>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 mt-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Generate Quiz</h1>
            <p className="text-gray-600 mb-8">
              {note ? `Create a quiz from: ${note.filename}` : 'Loading...'}
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions
                </label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={3}>3 questions (Quick)</option>
                  <option value={5}>5 questions (Standard)</option>
                  <option value={10}>10 questions (Comprehensive)</option>
                  <option value={15}>15 questions (Full Test)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {['easy', 'medium', 'hard'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`px-4 py-3 rounded-lg font-medium transition-all ${
                        difficulty === level
                          ? 'bg-purple-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateQuiz}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                Generate Quiz 🎯
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Generating Your Quiz...</h2>
          <p className="text-gray-600">This may take 30-60 seconds</p>
          <p className="text-sm text-gray-500 mt-2">🤖 AI is analyzing your document and creating questions</p>
        </div>
      </div>
    );
  }

  // Results screen
  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h1 className="text-3xl font-bold text-center mb-4">Quiz Results</h1>
            
            <div className="text-center mb-8">
              <div className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full px-8 py-4 text-4xl font-bold mb-2">
                {results.percentage}%
              </div>
              <p className="text-xl text-gray-700">
                {results.score} out of {results.total} correct
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {results.percentage >= 80 ? '🎉 Excellent!' : results.percentage >= 60 ? '👍 Good job!' : '📚 Keep studying!'}
              </p>
            </div>

            <div className="space-y-6">
              {results.results.map((result, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-lg border-2 ${
                    result.is_correct
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-800 flex-1">
                      {idx + 1}. {result.question}
                    </h3>
                    <span className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
                      result.is_correct ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {result.is_correct ? '✓ Correct' : '✗ Wrong'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Your answer:</span>{' '}
                      <span className={result.is_correct ? 'text-green-700' : 'text-red-700'}>
                        {result.user_answer}
                      </span>
                    </p>
                    {!result.is_correct && (
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">Correct answer:</span>{' '}
                        <span className="text-green-700">{result.correct_answer}</span>
                      </p>
                    )}
                  </div>

                  {result.explanation && (
                    <div className="bg-white bg-opacity-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Explanation:</strong> {result.explanation}
                      </p>
                      {result.page_reference && (
                        <p className="text-xs text-gray-500 mt-1">
                          📄 Reference: Page {result.page_reference}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setQuiz(null);
                  setShowResults(false);
                  setResults(null);
                }}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all"
              >
                Try Another Quiz
              </button>
              <Link
                to="/notes"
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all text-center"
              >
                Back to Notes
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz taking screen
  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {question.question}
          </h2>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => selectAnswer(idx)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  selectedAnswers[currentQuestion] === idx
                    ? 'border-purple-600 bg-purple-50 shadow-md scale-105'
                    : 'border-gray-300 hover:border-purple-300 hover:bg-gray-50'
                }`}
              >
                <span className="font-semibold text-purple-600 mr-3">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {option.text}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-4">
            <button
              onClick={previousQuestion}
              disabled={currentQuestion === 0}
              className="px-6 py-3 rounded-lg font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ← Previous
            </button>
            
            <div className="flex-1"></div>

            {currentQuestion < quiz.questions.length - 1 ? (
              <button
                onClick={nextQuestion}
                className="px-6 py-3 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 transition-all"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={submitQuiz}
                disabled={loading}
                className="px-8 py-3 rounded-lg font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Quiz 🎯'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
