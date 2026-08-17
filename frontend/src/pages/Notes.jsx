import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await api.get('/notes/');
      setNotes(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load notes');
      setLoading(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    setDeleteId(noteId);
    try {
      await api.delete(`/notes/${noteId}`);
      setNotes(notes.filter(note => note.id !== noteId));
      setDeleteId(null);
    } catch (err) {
      setError('Failed to delete note');
      setDeleteId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      done: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ready' },
      processing: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Processing' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' }
    };
    
    const badge = badges[status] || badges.processing;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Study Notes</h1>
            <p className="text-gray-600 mt-2">Manage and review your uploaded documents</p>
          </div>
          <Link
            to="/upload"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            + Upload New
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {notes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No notes yet</h3>
            <p className="text-gray-600 mb-6">Upload your first document to get started</p>
            <Link
              to="/upload"
              className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Upload Document
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {note.title}
                    </h3>
                    {getStatusBadge(note.status)}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {note.filename}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDate(note.created_at)}
                  </div>

                  {note.chunks_count && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {note.chunks_count} chunks indexed
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  {note.status === 'done' && (
                    <>
                      <Link
                        to={`/chat/${note.id}`}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-center"
                      >
                        💬 Chat
                      </Link>
                      <Link
                        to={`/quiz/${note.id}`}
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors text-center"
                      >
                        🎯 Quiz
                      </Link>
                      <Link
                        to={`/flashcards/${note.id}`}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
                      >
                        🎴 Cards
                      </Link>
                    </>
                  )}
                  
                  <button
                    onClick={() => handleDelete(note.id)}
                    disabled={deleteId === note.id}
                    className="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {deleteId === note.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
