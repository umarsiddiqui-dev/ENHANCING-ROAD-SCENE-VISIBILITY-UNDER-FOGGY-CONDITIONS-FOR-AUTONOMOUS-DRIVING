import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import ResultsDashboard from './components/ResultsDashboard';
import { DownloadCloud, Activity } from 'lucide-react';

function App() {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [batchId, setBatchId] = useState(null);
  const [error, setError] = useState(null);

  const handleProcess = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    setResults(null);
    
    const formData = new FormData();
    files.forEach(f => {
      formData.append('files', f.file);
    });

    // We can also append params if we want the advanced toggle later
    formData.append('clahe_clip', 2.0);
    formData.append('gamma_val', 1.5);
    formData.append('bilateral_d', 9);
    formData.append('dark_window', 15);

    try {
      const response = await fetch('http://localhost:8000/api/process', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const data = await response.json();
      setBatchId(data.batch_id);
      setResults(data.results);
    } catch (err) {
      setError(err.message || 'An error occurred during processing.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResults(null);
    setBatchId(null);
    setError(null);
  };

  return (
    <div className="app-container">
      <header className="header">
        <div>
          <div className="header-title">ENHANCING ROAD SCENE VISIBILITY UNDER FOGGY CONDITIONS FOR AUTONOMOUS DRIVING</div>
          <div className="header-subtitle">Computer Vision Pipeline Demo</div>
        </div>
        {results && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-primary" onClick={handleReset}>
              Start Over
            </button>
          </div>
        )}
      </header>

      <main className="main-content">
        {!results && (
          <section className="hero">
            <h1>Enhance Foggy Images and Improve Object Detection</h1>
            <p>
              Upload low-contrast or hazy images to run our multi-algorithm enhancement pipeline.
              Compare how CLAHE, Gamma Correction, Bilateral Filtering, and Dark Channel Prior affect YOLOv5 detection.
            </p>
          </section>
        )}

        {!results && !isProcessing && (
           <ImageUploader 
             files={files} 
             setFiles={setFiles} 
             onProcess={handleProcess}
             isProcessing={isProcessing}
           />
        )}

        {isProcessing && (
          <div className="card loader-container">
            <div className="spinner"></div>
            <h3>Processing Pipeline Active</h3>
            <p className="text-muted">Applying enhancements and running YOLOv5 detection...</p>
          </div>
        )}

        {error && (
          <div className="card" style={{ borderLeft: '4px solid #EF4444' }}>
            <h3 style={{ color: '#EF4444' }}>Error</h3>
            <p>{error}</p>
            <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {results && !isProcessing && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
              <Activity color="var(--primary)" />
              <h2>Analysis Results</h2>
            </div>
            
            <ResultsDashboard results={results} />
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
