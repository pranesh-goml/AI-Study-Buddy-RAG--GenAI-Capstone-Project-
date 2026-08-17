import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-gray-600">Ready to continue your learning journey?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
            <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Notes</h3>
            <p className="text-gray-600 mb-4">Upload your study materials and let AI do the magic</p>
            <Link 
              to="/upload"
              className="block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-center"
            >
              Upload Now
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">My Notes</h3>
            <p className="text-gray-600 mb-4">View and chat with your uploaded study materials</p>
            <Link 
              to="/notes"
              className="block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-center"
            >
              View Notes
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 opacity-60">
            <div className="bg-pink-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Generate Quiz</h3>
            <p className="text-gray-600 mb-4">Test your knowledge with AI-generated quizzes</p>
            <button 
              disabled
              className="w-full bg-pink-600 text-white px-4 py-2 rounded-lg opacity-50 cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
