import React, { useState } from 'react';
import { UploadCloud, X } from 'lucide-react';

export default function ImageUploader({ files, setFiles, onProcess, isProcessing }) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles) => {
    const imageFiles = newFiles.filter(file => file.type.startsWith('image/'));
    
    const mappedFiles = imageFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      preview: URL.createObjectURL(file)
    }));
    
    setFiles(prev => [...prev, ...mappedFiles].slice(0, 10)); // Max 10 images
  };

  const removeFile = (id) => {
    setFiles(files.filter(f => f.id !== id));
  };

  return (
    <div className="card">
      <div 
        className={`uploader-area ${isDragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload').click()}
      >
        <input
          id="file-upload"
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          style={{ display: 'none' }}
          onChange={handleChange}
        />
        <UploadCloud className="uploader-icon" />
        <h3>Drag & Drop images here</h3>
        <p className="text-muted" style={{marginTop: '0.5rem', marginBottom: '1rem'}}>
          or click to browse from your computer
        </p>
        <button className="btn-primary" type="button" onClick={(e) => { e.stopPropagation(); document.getElementById('file-upload').click() }}>
          Select Files
        </button>
      </div>

      {files.length > 0 && (
        <div className="thumbnails-grid">
          {files.map(f => (
            <div key={f.id} className="thumbnail-wrapper">
              <img src={f.preview} alt="preview" />
              <button 
                className="remove-btn" 
                onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="action-bar">
          <button 
            className="btn-primary" 
            style={{ padding: '1rem 2.5rem', fontSize: '1.125rem' }}
            onClick={onProcess}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing... (This may take a moment)' : 'Run Enhancement & Detection'}
          </button>
        </div>
      )}
    </div>
  );
}
