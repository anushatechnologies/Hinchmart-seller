import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export function BarcodeBox({
  value,
  labelSize = '4x6',
  height,
  width,
  displayValue = true,
  className = '',
}) {
  const svgRef = useRef(null);

  const defaultHeight = height || (labelSize === '4x6' ? 36 : labelSize === '3x2' ? 26 : 18);
  const defaultWidth = width || (labelSize === '4x6' ? 1.3 : 1.1);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, String(value), {
          format: 'CODE128',
          width: defaultWidth,
          height: defaultHeight,
          displayValue,
          fontSize: labelSize === '4x6' ? 9 : 8,
          font: 'monospace',
          margin: 2,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (e) {
        console.error('Error rendering Barcode in BarcodeBox:', e);
      }
    }
  }, [value, defaultHeight, defaultWidth, displayValue, labelSize]);

  return (
    <div className={`barcode-box flex flex-col items-center justify-center ${className}`}>
      <svg ref={svgRef} className="max-w-full" />
    </div>
  );
}
