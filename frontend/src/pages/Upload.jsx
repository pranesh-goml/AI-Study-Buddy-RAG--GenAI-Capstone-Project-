import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [jobId, setJobId] = useState(null);
  const [noteId, setNoteId] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const { user } = useAuth();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    const allowedTypes = ['application/pdf', 'text/plain'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Only PDF and TXT files are allowed');
      return;
    }

    if (selectedFile.size > maxSize) {
      setError('File size must be less than 50MB');
      return;
    }

    setFile(selectedFile);
    setTitle(selectedFile.name);
    setError('');
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const pollJobStatus = async (jobId) => {
    try {
      const response = await api.get(`/upload/status/${jobId}`);
      const { status, progress } = response.data;
      
      setUploadProgress(progress);

      if (status === 'done') {
        setTimeout(() => {
          window.location.href = '/notes';
        }, 1500);
      } else if (status === 'failed') {
        setError('File processing failed. Please try again.');
        setUploading(false);
      } else {
        // Continue polling
        setTimeout(() => pollJobStatus(jobId), 1000);
      }
    } catch (err) {
      console.error('Error polling job status:', err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    try {
      const response = await api.post('/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setJobId(response.data.job_id);
      setNoteId(response.data.note_id);
      
      // Start polling for status
      pollJobStatus(response.data.job_id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setUploading(false);
    setUploadProgress(0);
    setJobId(null);
    setNoteId(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Upload Study Notes</h1>
          
          {!uploading ? (
            <form onSubmit={handleUpload} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="My Study Notes"
                />
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 hover:border-indigo-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Choose different file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-indigo-600 hover:text-indigo-700 font-medium">
                          Choose a file
                        </span>
                        <span className="text-gray-600"> or drag and drop</span>
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.txt"
                        onChange={handleFileInput}
                      />
                    </div>
                    <p className="text-sm text-gray-500">PDF or TXT up to 50MB</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!file}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Upload and Process
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <svg className="animate-spin h-16 w-16 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Your Document</h3>
                <p className="text-gray-600 mb-6">
                  We're extracting text, generating embeddings, and indexing your content...
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>

              {uploadProgress === 100 && (
                <div className="text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-800 font-medium">Processing complete! Redirecting...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Upload;
