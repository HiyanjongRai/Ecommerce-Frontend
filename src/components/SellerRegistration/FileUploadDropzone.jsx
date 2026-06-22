import React, { useState, useRef } from 'react';

const FileUploadDropzone = ({ label, id, file, onChange, required = false, error }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [localError, setLocalError] = useState(null);
  const inputRef = useRef(null);

  const displayError = error || localError;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (selectedFile) => {
    if (!selectedFile) return;

    // Check size limit: 10MB
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setLocalError('File size exceeds the 10MB limit.');
      onChange(null);
      return;
    }

    // Check type: pdf, png, jpg, jpeg
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    const fileExt = selectedFile.name.split('.').pop().toLowerCase();
    const isAllowedExt = ['pdf', 'png', 'jpg', 'jpeg'].includes(fileExt);
    const isAllowedType = allowedTypes.includes(selectedFile.type) || isAllowedExt;

    if (!isAllowedType) {
      setLocalError('Invalid file type. Only PDF, PNG, and JPG are accepted.');
      onChange(null);
      return;
    }

    setLocalError(null);
    onChange(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(null);
    setLocalError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col font-inter">
      {/* Label */}
      <span className="text-xs font-bold text-reg-accent mb-1.5 uppercase tracking-wider flex items-center">
        {label} {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>

      {file ? (
        /* Selected File Chip */
        <div className="flex items-center justify-between p-3.5 bg-white border border-reg-primary/30 rounded-xl shadow-xs transition-all duration-200 hover:shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* File type icon */}
            <div className="w-10 h-10 rounded-lg bg-reg-primary-light flex items-center justify-center text-reg-primary flex-shrink-0">
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            {/* File info */}
            <div className="min-w-0">
              <p className="text-sm font-bold text-reg-accent truncate leading-snug">
                {file.name}
              </p>
              <p className="text-xs text-reg-text-sec font-semibold mt-0.5 leading-none">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          {/* Action button */}
          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 rounded-lg border border-red-100 hover:border-red-200 text-red-500 hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 transition-all duration-200 cursor-pointer active:scale-95"
            aria-label={`Remove file ${file.name}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      ) : (
        /* Dropzone area */
        <label
          htmlFor={id}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 outline-none select-none text-center ${
            isDragActive
              ? 'border-reg-primary bg-emerald-50/40 ring-4 ring-reg-primary/10'
              : displayError
              ? 'border-red-300 hover:border-red-400 bg-red-50/10'
              : 'border-reg-border hover:border-reg-primary/60 hover:bg-gray-50/50'
          } focus-within:ring-4 focus-within:ring-reg-primary/15 focus-within:border-reg-primary`}
        >
          {/* File Input hidden */}
          <input
            ref={inputRef}
            type="file"
            id={id}
            className="sr-only"
            onChange={handleChange}
            accept=".pdf,.png,.jpg,.jpeg"
            aria-describedby={displayError ? `${id}-error` : undefined}
          />
          
          {/* Cloud Upload Icon */}
          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-reg-border/80 flex items-center justify-center text-reg-text-sec shadow-3xs mb-3 group-hover:scale-105 transition-transform duration-200">
            <svg className="w-5.5 h-5.5 text-reg-text-sec" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-reg-accent">
              Drag & drop file here, or <span className="text-reg-primary hover:text-reg-primary-dark">browse</span>
            </p>
            <p className="text-xs font-semibold text-reg-text-sec">
              PDF, PNG, JPG up to 10MB
            </p>
          </div>
        </label>
      )}

      {/* Error display */}
      {displayError && (
        <p id={`${id}-error`} className="text-xs text-red-500 font-bold mt-1.5 leading-none">
          {displayError}
        </p>
      )}
    </div>
  );
};

export default FileUploadDropzone;
