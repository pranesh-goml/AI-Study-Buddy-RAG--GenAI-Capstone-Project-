import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Chat = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchNote();
  }, [noteId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchNote = async () => {
    try {
      const response = await api.get(`/notes/${noteId}`);
      setNote(response.data);
      
      if (response.data.status !== 'done') {
        setError('This note is still being processed. Please wait...');
      }
    } catch (err) {
      setError('Failed to load note');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/rag/ask', {
        note_id: noteId,
        question: input,
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.answer,
        sources: response.data.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get answer');
      // Remove the user message if the request failed
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "What are the main topics covered?",
    "Can you summarize this document?",
    "What are the key takeaways?",
    "Explain the main concepts",
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/notes')}
              className="mr-4 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {note?.title || 'Loading...'}
              </h1>
              <p className="text-sm text-gray-500">Ask questions about your document</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMessages([])}
              className="text-gray-600 hover:text-gray-900 transition-colors"
              title="Clear chat"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Start a conversation</h3>
              <p className="text-gray-600 mb-6">Ask me anything about your document</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-left hover:border-indigo-500 hover:bg-indigo-50 transition-all text-sm text-gray-700"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-2xl px-6 py-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : 'bg-white shadow-md border border-gray-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Sources:</p>
                      <div className="space-y-2">
                        {message.sources.map((source, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3 text-sm">
                            <p className="font-medium text-gray-900 mb-1">
                              Page {source.page}
                            </p>
                            <p className="text-gray-600 text-xs line-clamp-2">
                              {source.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white shadow-md border border-gray-200 rounded-2xl px-6 py-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your document..."
              disabled={loading || note?.status !== 'done'}
              className="flex-1 px-6 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || note?.status !== 'done'}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
