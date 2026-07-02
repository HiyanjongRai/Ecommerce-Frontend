import React, { useState, useRef, useEffect } from 'react';

const FileUpload = ({
  label = 'Upload file',
  acceptedTypes = '*',
  maxSizeMB = 10,
  onUploadComplete = null,
  onUploadError = null,
  uploadSpeed = 180,
}) => {
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, complete, error
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const stylesInjectedRef = useRef(false);

  // Inject styles once
  useEffect(() => {
    if (!stylesInjectedRef.current) {
      const styleId = 'fu-component-styles';
      if (!document.getElementById(styleId)) {
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = `
          :root {
            --fu-blue: #378ADD;
            --fu-green: #639922;
            --fu-red: #E24B4A;
            --fu-gray-50: #F9FAFB;
            --fu-gray-100: #F3F4F6;
            --fu-gray-200: #E5E7EB;
            --fu-gray-300: #D1D5DB;
            --fu-gray-400: #9CA3AF;
            --fu-gray-500: #6B7280;
            --fu-gray-700: #374151;
            --fu-gray-900: #111827;
          }

          .fu-container {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .fu-button {
            display: inline-flex;
            align-items: center;
            gap: 0.625rem;
            padding: 0.75rem 1.25rem;
            border-radius: 0.75rem;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            transition: all 0.3s ease;
            cursor: pointer;
            border: 2px solid;
            background: transparent;
            outline: none;
          }

          .fu-button:disabled {
            cursor: not-allowed;
          }

          .fu-button-idle {
            background-color: white;
            border-color: var(--fu-gray-300);
            color: var(--fu-gray-700);
          }

          .fu-button-idle:hover:not(:disabled) {
            border-color: var(--fu-gray-400);
            background-color: var(--fu-gray-50);
          }

          .fu-button-uploading {
            background-color: rgba(55, 138, 221, 0.1);
            border-color: var(--fu-blue);
            color: var(--fu-blue);
          }

          .fu-button-complete {
            background-color: rgba(99, 153, 34, 0.1);
            border-color: var(--fu-green);
            color: var(--fu-green);
          }

          .fu-icon {
            width: 1rem;
            height: 1rem;
            flex-shrink: 0;
          }

          .fu-spinner {
            animation: fu-spin 1s linear infinite;
          }

          @keyframes fu-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .fu-notification {
            background-color: white;
            border-radius: 0.75rem;
            padding: 1rem;
            animation: fu-slideInUp 0.3s ease-out;
            border-left: 3px solid;
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
          }

          .fu-notification-uploading {
            border-left-color: var(--fu-blue);
          }

          .fu-notification-complete {
            border-left-color: var(--fu-green);
          }

          .fu-notification-error {
            border-left-color: var(--fu-red);
          }

          @keyframes fu-slideInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .fu-notification-content {
            display: flex;
            align-items: start;
            gap: 0.75rem;
          }

          .fu-icon-wrapper {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .fu-icon-wrapper-blue {
            background-color: rgba(55, 138, 221, 0.1);
            color: var(--fu-blue);
          }

          .fu-icon-wrapper-green {
            background-color: rgba(99, 153, 34, 0.1);
            color: var(--fu-green);
          }

          .fu-icon-wrapper-red {
            background-color: rgba(226, 75, 74, 0.1);
            color: var(--fu-red);
          }

          .fu-notification-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .fu-notification-header {
            display: flex;
            align-items: start;
            justify-content: space-between;
            gap: 0.75rem;
          }

          .fu-notification-title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.25rem;
          }

          .fu-title-text {
            font-size: 0.875rem;
            font-weight: 700;
            color: var(--fu-gray-900);
          }

          .fu-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.125rem 0.5rem;
            border-radius: 9999px;
            font-size: 0.625rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .fu-badge-blue {
            background-color: rgba(55, 138, 221, 0.1);
            color: var(--fu-blue);
          }

          .fu-badge-green {
            background-color: rgba(99, 153, 34, 0.1);
            color: var(--fu-green);
          }

          .fu-badge-red {
            background-color: rgba(226, 75, 74, 0.1);
            color: var(--fu-red);
          }

          .fu-subtitle {
            font-size: 0.75rem;
            color: var(--fu-gray-500);
            font-weight: 500;
          }

          .fu-progress-container {
            display: flex;
            flex-direction: column;
            gap: 0.375rem;
          }

          .fu-progress-bar-wrapper {
            width: 100%;
            height: 0.5rem;
            background-color: var(--fu-gray-100);
            border-radius: 9999px;
            overflow: hidden;
          }

          .fu-progress-bar {
            height: 100%;
            border-radius: 9999px;
            transition: width 0.3s ease-out;
          }

          .fu-progress-bar-blue {
            background-color: var(--fu-blue);
          }

          .fu-progress-bar-green {
            background-color: var(--fu-green);
          }

          .fu-progress-text {
            font-size: 0.625rem;
            font-weight: 700;
          }

          .fu-progress-text-blue {
            color: var(--fu-blue);
          }

          .fu-progress-text-green {
            color: var(--fu-green);
          }

          .fu-reset-link {
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--fu-green);
            text-decoration: underline;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            transition: color 0.2s;
          }

          .fu-reset-link:hover {
            color: rgba(99, 153, 34, 0.8);
          }

          .fu-file-info {
            font-size: 0.625rem;
            color: var(--fu-gray-500);
            font-weight: 600;
            margin-top: 0.25rem;
          }

          .fu-hidden-input {
            display: none;
          }
        `;
        document.head.appendChild(styleEl);
        stylesInjectedRef.current = true;
      }
    }
  }, []);

  // Auto-animate progress bar during upload
  useEffect(() => {
    if (uploadState === 'uploading') {
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressIntervalRef.current);
            // Small delay before completing
            setTimeout(() => {
              setUploadState('complete');
              if (onUploadComplete && selectedFile) {
                onUploadComplete(selectedFile);
              }
            }, 200);
            return 100;
          }
          // Random increment between 3-8%
          const increment = Math.floor(Math.random() * 6) + 3;
          return Math.min(prev + increment, 100);
        });
      }, uploadSpeed);

      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    }
  }, [uploadState, uploadSpeed, onUploadComplete, selectedFile]);

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      const error = `File size (${formatFileSize(file.size)}) exceeds maximum allowed size of ${maxSizeMB}MB`;
      setErrorMessage(error);
      setUploadState('error');
      if (onUploadError) {
        onUploadError(new Error(error));
      }
      return;
    }

    // Start upload simulation
    setSelectedFile(file);
    setProgress(0);
    setErrorMessage('');
    setUploadState('uploading');
  };

  // Handle button click
  const handleButtonClick = () => {
    if (uploadState === 'idle' || uploadState === 'error') {
      fileInputRef.current?.click();
    }
  };

  // Handle reset
  const handleReset = () => {
    setUploadState('idle');
    setProgress(0);
    setSelectedFile(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload icon SVG
  const UploadIcon = () => (
    <svg className="fu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );

  // Spinner icon SVG
  const SpinnerIcon = () => (
    <svg className="fu-icon fu-spinner" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  // Check circle icon SVG
  const CheckCircleIcon = () => (
    <svg className="fu-icon" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );

  // Alert circle icon SVG
  const AlertCircleIcon = () => (
    <svg className="fu-icon" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className="fu-container">
      {/* Upload Button */}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={uploadState === 'uploading'}
        className={`fu-button ${
          uploadState === 'idle' || uploadState === 'error'
            ? 'fu-button-idle'
            : uploadState === 'uploading'
            ? 'fu-button-uploading'
            : 'fu-button-complete'
        }`}
      >
        {(uploadState === 'idle' || uploadState === 'error') && (
          <>
            <UploadIcon />
            <span>{label}</span>
          </>
        )}
        {uploadState === 'uploading' && (
          <>
            <SpinnerIcon />
            <span>Uploading…</span>
          </>
        )}
        {uploadState === 'complete' && (
          <>
            <CheckCircleIcon />
            <span>Upload complete</span>
          </>
        )}
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileChange}
        className="fu-hidden-input"
      />

      {/* Error Notification */}
      {uploadState === 'error' && (
        <div className="fu-notification fu-notification-error">
          <div className="fu-notification-content">
            <div className="fu-icon-wrapper fu-icon-wrapper-red">
              <AlertCircleIcon />
            </div>
            <div className="fu-notification-body">
              <div>
                <div className="fu-notification-title">
                  <h4 className="fu-title-text">Upload failed</h4>
                  <span className="fu-badge fu-badge-red">Error</span>
                </div>
                <p className="fu-subtitle">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="fu-reset-link"
                style={{ color: 'var(--fu-red)' }}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uploading Notification */}
      {uploadState === 'uploading' && (
        <div className="fu-notification fu-notification-uploading">
          <div className="fu-notification-content">
            <div className="fu-icon-wrapper fu-icon-wrapper-blue">
              <SpinnerIcon />
            </div>
            <div className="fu-notification-body">
              <div className="fu-notification-header">
                <div>
                  <div className="fu-notification-title">
                    <h4 className="fu-title-text">Uploading…</h4>
                    <span className="fu-badge fu-badge-blue">In progress</span>
                  </div>
                  <p className="fu-subtitle">Your file is being uploaded.</p>
                </div>
              </div>
              <div className="fu-progress-container">
                <div className="fu-progress-bar-wrapper">
                  <div
                    className="fu-progress-bar fu-progress-bar-blue"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="fu-progress-text fu-progress-text-blue">
                  {progress}% complete
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Notification */}
      {uploadState === 'complete' && selectedFile && (
        <div className="fu-notification fu-notification-complete">
          <div className="fu-notification-content">
            <div className="fu-icon-wrapper fu-icon-wrapper-green">
              <CheckCircleIcon />
            </div>
            <div className="fu-notification-body">
              <div className="fu-notification-header">
                <div>
                  <div className="fu-notification-title">
                    <h4 className="fu-title-text">Upload complete!</h4>
                    <span className="fu-badge fu-badge-green">Complete</span>
                  </div>
                  <p className="fu-subtitle">
                    {selectedFile.name}
                  </p>
                  <p className="fu-file-info">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <div className="fu-progress-container">
                <div className="fu-progress-bar-wrapper">
                  <div
                    className="fu-progress-bar fu-progress-bar-green"
                    style={{ width: '100%' }}
                  />
                </div>
                <p className="fu-progress-text fu-progress-text-green">
                  100% complete
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="fu-reset-link"
              >
                Upload another file
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
