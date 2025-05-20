import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AnimationView({ simulationId }) {
  const [animationStatus, setAnimationStatus] = useState('idle'); // idle, generating, complete, error
  const [animationId, setAnimationId] = useState(null);
  const [animationUrl, setAnimationUrl] = useState(null);
  const [error, setError] = useState(null);

  const generateAnimation = async () => {
    setAnimationStatus('generating');
    setError(null);
    
    try {
      const response = await axios.post(`/api/simulations/${simulationId}/generate-animation`);
      setAnimationId(response.data.animation_id);
      checkAnimationStatus(response.data.animation_id);
    } catch (err) {
      console.error('Error starting animation generation:', err);
      setAnimationStatus('error');
      setError(err.response?.data?.error || 'Failed to generate animation');
    }
  };

  const checkAnimationStatus = async (id) => {
    try {
      const response = await axios.get(`/api/animations/${id}/status`);
      
      if (response.data.status === 'complete') {
        setAnimationStatus('complete');
        setAnimationUrl(response.data.url);
      } else {
        // Check again in 2 seconds
        setTimeout(() => checkAnimationStatus(id), 2000);
      }
    } catch (err) {
      console.error('Error checking animation status:', err);
      setAnimationStatus('error');
      setError(err.response?.data?.error || 'Failed to check animation status');
    }
  };

  const downloadAnimation = () => {
    if (animationUrl) {
      window.location.href = animationUrl;
    }
  };

  // Clean up polling when component unmounts
  useEffect(() => {
    return () => {
      // Any cleanup needed for polling
    };
  }, []);

  if (!simulationId) {
    return null;
  }

  return (
    <div className="animation-container">
      <h3>Simulation Animation</h3>
      
      {animationStatus === 'idle' && (
        <button 
          onClick={generateAnimation}
          className="generate-animation-btn"
        >
          Generate Animation
        </button>
      )}
      
      {animationStatus === 'generating' && (
        <div className="generating-status">
          <div className="spinner"></div>
          <p>Generating animation... This may take a few minutes.</p>
        </div>
      )}
      
      {animationStatus === 'error' && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={generateAnimation}>Try Again</button>
        </div>
      )}
      
      {animationStatus === 'complete' && animationUrl && (
        <div className="animation-result">
          <img 
            src={animationUrl} 
            alt="Disease Spread Animation" 
            className="animation-gif"
          />
          <button 
            onClick={downloadAnimation}
            className="download-btn"
          >
            Download Animation
          </button>
        </div>
      )}
    </div>
  );
}

export default AnimationView;