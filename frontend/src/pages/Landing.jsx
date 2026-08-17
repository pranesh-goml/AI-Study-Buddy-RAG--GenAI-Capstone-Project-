import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 animate-slide-up">
              Learn Smarter with AI
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-indigo-100 animate-slide-up animation-delay-200">
              Upload your notes, ask questions, and generate quizzes instantly
            </p>
            <div className="flex justify-center space-x-4 animate-slide-up animation-delay-400">
              {user ? (
                <Link
                  to="/dashboard"
                  className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-opacity-90 transform hover:scale-105 transition-all duration-200 shadow-xl"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-opacity-90 transform hover:scale-105 transition-all duration-200 shadow-xl"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    to="/login"
                    className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-indigo-600 transform hover:scale-105 transition-all duration-200"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">AI Q&A</h3>
              <p className="text-gray-600">
                Ask any question about your notes and get instant, accurate answers powered by AI
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Auto Quizzes</h3>
              <p className="text-gray-600">
                Generate custom quizzes from your notes to test your knowledge
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-pink-50 to-red-50 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="bg-pink-600 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Flashcards</h3>
              <p className="text-gray-600">
                Create flashcards automatically to improve retention and recall
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-indigo-600 text-white w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Upload Notes</h3>
              <p className="text-gray-600">
                Upload your lecture notes or study materials in PDF or text format
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-600 text-white w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">AI Processes</h3>
              <p className="text-gray-600">
                Our AI analyzes and indexes your content for intelligent retrieval
              </p>
            </div>
            <div className="text-center">
              <div className="bg-pink-600 text-white w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Study Smart</h3>
              <p className="text-gray-600">
                Ask questions, generate quizzes, and ace your exams with confidence
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Learning?</h2>
          <p className="text-xl mb-8 text-indigo-100">
            Join thousands of students already studying smarter with AI Study Buddy
          </p>
          {!user && (
            <Link
              to="/register"
              className="bg-white text-indigo-600 px-12 py-4 rounded-lg font-bold text-lg hover:bg-opacity-90 transform hover:scale-105 transition-all duration-200 shadow-xl inline-block"
            >
              Start Learning for Free
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Landing;
