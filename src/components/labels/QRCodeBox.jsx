import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export function QRCodeBox({
  value,
  size = 'medium', // 'small' | 'medium' | 'large'
  position = 'bottom-right', // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'
  labelSize = '4x6', // '4x6' | '3x2' | '2x1'
  showCaption = true,
  captionText = 'SCAN TO VERIFY',
  className = '',
}) {
  const canvasRef = useRef(null);

  // Compute pixel dimensions based on QR size and label standard format
  const getPixelSize = () => {
    const scaleFactor = labelSize === '4x6' ? 1 : labelSize === '3x2' ? 0.8 : 0.65;

    switch (size) {
      case 'small':
        return Math.round(36 * scaleFactor);
      case 'large':
        return Math.round(68 * scaleFactor);
      case 'medium':
      default:
        return Math.round(50 * scaleFactor);
    }
  };

  const pixelSize = getPixelSize();

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        QRCode.toCanvas(
          canvasRef.current,
          String(value),
          {
            width: pixelSize,
            margin: 0,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          },
          (error) => {
            if (error) console.error('Error rendering QR Code:', error);
          }
        );
      } catch (err) {
        console.error('QR Code generation error:', err);
      }
    }
  }, [value, pixelSize]);

  return (
    <div
      className={`qr-code-box p-1 bg-white border-2 border-slate-900 rounded flex flex-col items-center justify-center shadow-xs shrink-0 select-none ${className}`}
      data-qr-position={position}
      data-qr-size={size}
    >
      <canvas ref={canvasRef} className="block bg-white" />
      {showCaption && (
        <span className="text-[6.5px] font-black text-slate-900 tracking-tighter uppercase mt-0.5 leading-none">
          {captionText}
        </span>
      )}
    </div>
  );
}
