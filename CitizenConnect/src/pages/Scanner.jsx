import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ChevronLeft, QrCode } from 'lucide-react';
import './Scanner.css';

const Scanner = () => {
  const navigate = useNavigate();
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, onScanFailure);

    function onScanSuccess(decodedText) {
      console.log(`Scan result: ${decodedText}`);
      scanner.clear();
      
      // Direct redirect to report flow (Login handles the rest)
      navigate('/report');
    }

    function onScanFailure(error) {
      // Just ignore failures (too frequent)
    }

    return () => {
      scanner.clear().catch(err => console.error("Failed to clear scanner", err));
    };
  }, [navigate]);

  return (
    <div className="scanner-page">
      <div className="scanner-header">
        <ChevronLeft className="back-btn" onClick={() => navigate(-1)} />
        <h1>Scan Area QR</h1>
      </div>
      
      <div className="scanner-container">
        <div id="reader"></div>
        <div className="scanner-overlay-text">
          <QrCode size={32} />
          <p>Align the QR code within the frame</p>
        </div>
      </div>

      <div className="scanner-footer">
        <p>Scanning will automatically detect your local area</p>
      </div>
    </div>
  );
};

export default Scanner;
