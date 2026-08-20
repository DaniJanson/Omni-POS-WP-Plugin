import { useEffect, useRef } from 'react';

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  maxDelay?: number; // Maximum ms between characters (scanners send < 30-50ms)
  minLength?: number; // Minimum barcode length
  enabled?: boolean;
}

export function useBarcodeScanner({
  onScan,
  maxDelay = 50,
  minLength = 2,
  enabled = true,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Handle Enter (Scanner submit)
      if (e.key === 'Enter') {
        const barcode = bufferRef.current.trim();
        bufferRef.current = '';

        if (barcode.length >= minLength) {
          // If scanner scanned rapidly or user hit enter on an active barcode search field
          onScan(barcode);
          if (!isInput) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
        return;
      }

      // Ignore single modifier keys
      if (e.key.length > 1) {
        return;
      }

      // Check speed: if typed slowly and user is in an active input, reset buffer
      if (timeDiff > maxDelay && isInput) {
        bufferRef.current = e.key;
        return;
      }

      // If time between keystrokes was too long, start a new buffer
      if (timeDiff > maxDelay) {
        bufferRef.current = e.key;
      } else {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onScan, maxDelay, minLength, enabled]);
}
