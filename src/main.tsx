// Ensure fetch property is writable on window / globalThis to prevent
// "TypeError: Cannot set property fetch of #<Window> which has only a getter"
// in restricted iframe environments
try {
  const g = typeof window !== 'undefined' ? window : globalThis;
  const desc = Object.getOwnPropertyDescriptor(g, 'fetch') || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(g), 'fetch');
  if (desc && !desc.writable && !desc.set) {
    let currentFetch = g.fetch;
    Object.defineProperty(g, 'fetch', {
      get() { return currentFetch; },
      set(val) { currentFetch = val; },
      configurable: true,
      enumerable: true,
    });
  }
} catch {
  // Ignore if running in non-configurable environment
}

// Defensive wrap for AbortController.prototype.abort
try {
  if (typeof AbortController !== 'undefined' && AbortController.prototype && AbortController.prototype.abort) {
    const origAbort = AbortController.prototype.abort;
    AbortController.prototype.abort = function (reason?: unknown) {
      try {
        if (reason !== undefined) {
          return origAbort.call(this, reason);
        } else {
          return origAbort.call(this, new DOMException('Request was aborted.', 'AbortError'));
        }
      } catch {
        // Benign abort error - suppress to prevent uncaught exceptions in WebChannel/Firestore
        return;
      }
    };
  }
} catch {
  // Ignore if non-configurable
}

// Helper to identify benign network, abort, or stream cancellation errors
function isBenignNetworkOrAbort(value: unknown): boolean {
  if (!value) return false;
  const str = (
    typeof value === 'object' && value !== null
      ? (value as { message?: string; name?: string; code?: string; stack?: string }).message ||
        (value as { message?: string; name?: string; code?: string; stack?: string }).name ||
        String(value)
      : String(value)
  ).toLowerCase();

  return (
    str.includes('signal is aborted') ||
    str.includes('aborted without reason') ||
    str.includes('failed to fetch') ||
    str.includes('aborterror') ||
    str.includes('user aborted') ||
    str.includes('the user aborted a request') ||
    str.includes('request was aborted') ||
    str.includes('the client is offline') ||
    str.includes('network error') ||
    str.includes('could not reach cloud firestore backend') ||
    str.includes('cancelled')
  );
}

// Intercept benign abort and fetch errors from unhandled promise rejections & error events
if (typeof window !== 'undefined') {
  const origOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    if (isBenignNetworkOrAbort(message) || isBenignNetworkOrAbort(error)) {
      return true;
    }
    if (typeof origOnError === 'function') {
      return origOnError.apply(this, [message, source, lineno, colno, error]);
    }
    return false;
  };

  const origUnhandled = window.onunhandledrejection;
  window.onunhandledrejection = function (event) {
    if (isBenignNetworkOrAbort(event?.reason)) {
      event?.preventDefault?.();
      return true;
    }
    if (typeof origUnhandled === 'function') {
      return origUnhandled.apply(this, [event]);
    }
  };

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      if (isBenignNetworkOrAbort(event.reason)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    { capture: true }
  );

  window.addEventListener(
    'error',
    (event) => {
      if (isBenignNetworkOrAbort(event.message) || isBenignNetworkOrAbort(event.error)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    { capture: true }
  );
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
