import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

export function BarcodeRenderer({ value, format = 'CODE128', height = 40, width = 1.5, displayValue = true }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, String(value), {
          format,
          width,
          height,
          displayValue,
          fontSize: 10,
          font: 'monospace',
          margin: 4,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (e) {
        console.error('Error generating barcode:', e);
      }
    }
  }, [value, format, height, width, displayValue]);

  return <svg ref={svgRef} className="max-w-full" />;
}

export function QrCodeRenderer({ value, size = 48, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        String(value),
        {
          width: size,
          margin: 0,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Error generating QR:', error);
        }
      );
    }
  }, [value, size]);

  return <canvas ref={canvasRef} className={`block bg-white ${className}`} />;
}
