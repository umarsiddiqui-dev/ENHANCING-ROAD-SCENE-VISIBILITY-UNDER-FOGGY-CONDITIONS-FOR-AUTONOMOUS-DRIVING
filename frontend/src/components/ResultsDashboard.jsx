import React, { useState } from 'react';
import ImageComparisonSlider from './ImageComparisonSlider';
import { DownloadCloud } from 'lucide-react';
import { saveAs } from 'file-saver';

const METHOD_LABELS = {
  clahe: 'CLAHE',
  gamma: 'Gamma Correction',
  bilateral: 'Bilateral Filtering',
  dark_channel: 'Dark Channel Prior'
};

export default function ResultsDashboard({ results }) {
  if (!results || results.length === 0) return null;

  return (
    <div className="results-container">
      {results.map((result, idx) => (
        <ResultItem key={result.id || idx} data={result} />
      ))}
      
      <div className="card">
        <h3>Detection Summary (Average across images)</h3>
        <div className="summary-table-wrapper" style={{marginTop: '1rem'}}>
          <table className="summary-table">
            <thead>
              <tr>
                <th>Enhancement Method</th>
                <th>Avg Objects Detected</th>
                <th>Avg Confidence Score</th>
              </tr>
            </thead>
            <tbody>
              {['original', 'clahe', 'gamma', 'bilateral', 'dark_channel'].map(method => {
                const numImages = results.length;
                let totalObjects = 0;
                let totalConf = 0;
                
                results.forEach(r => {
                   totalObjects += r.methods[method].objects;
                   totalConf += r.methods[method].confidence;
                });
                
                return (
                  <tr key={method}>
                    <td>{method === 'original' ? 'Original Baseline' : METHOD_LABELS[method]}</td>
                    <td>{(totalObjects / numImages).toFixed(1)}</td>
                    <td>{(totalConf / numImages).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ResultItem({ data }) {
  const [activeMethod, setActiveMethod] = useState('clahe');
  
  const original = data.methods.original;
  const active = data.methods[activeMethod];

  const handleDownload = async (format) => {
    // Generate safe filename
    const baseName = data.filename ? data.filename.split('.')[0].replace(/[^a-zA-Z0-9_-]/g, '_') : 'enhanced_image';
    const filename = `${baseName}_${activeMethod}.${format}`;
    
    try {
        let downloadUrl = active.image;
        
        // If PNG is requested, draw the image to a canvas to convert it
        if (format === 'png') {
            downloadUrl = await new Promise((resolve, reject) => {
                const img = new window.Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = reject;
                img.src = active.image;
            });
        }
        
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        
        // Use file-saver to strictly enforce the filename and type
        saveAs(blob, filename);

    } catch (err) {
        console.error("Error downloading image:", err);
        alert("Failed to download image. Please try again.");
    }
  };

  return (
    <div className="card result-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>File: {data.filename}</h3>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {Object.keys(METHOD_LABELS).map(method => (
            <button 
              key={method}
              className="btn-primary"
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.875rem',
                background: activeMethod === method ? 'linear-gradient(135deg, var(--primary), #8B5CF6)' : '#334155',
                color: 'white',
                border: '1px solid',
                borderColor: activeMethod === method ? 'transparent' : '#475569',
                opacity: activeMethod === method ? 1 : 0.8
              }}
              onClick={() => setActiveMethod(method)}
            >
              {METHOD_LABELS[method]}
            </button>
          ))}
        </div>
      </div>
      
      <ImageComparisonSlider 
        imageBefore={original.image} 
        imageAfter={active.image} 
      />
      
      <div className="result-grid">
        <div className="result-card">
          <div className="result-header">Original (Baseline)</div>
          <div className="result-stats">
            <span>Objects Detected: <span className="stat-value">{original.objects}</span></span>
            <span>Avg Confidence: <span className="stat-value">{original.confidence.toFixed(2)}</span></span>
          </div>
        </div>
        
        <div className="result-card">
          <div className="result-header">{METHOD_LABELS[activeMethod]} Enhanced</div>
          <div className="result-stats">
            <span>Objects Detected: <span className="stat-value">{active.objects}</span></span>
            <span>Avg Confidence: <span className="stat-value">{active.confidence.toFixed(2)}</span></span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
        <button className="btn-primary" onClick={() => handleDownload('jpeg')}>
          <DownloadCloud size={16} />
          Download JPEG
        </button>
        <button className="btn-primary" onClick={() => handleDownload('png')}>
          <DownloadCloud size={16} />
          Download PNG
        </button>
      </div>
    </div>
  );
}
