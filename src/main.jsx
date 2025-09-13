import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { traceEnabled } from './utils/trace-toggle'

// Runtime-toggled tracing (enable with ?trace=1)
if (traceEnabled()) {
  window.addEventListener('error', (e) =>
    console.error('[TRACE] window.error', { 
      message: e.message, 
      stack: e.error?.stack, 
      src: e.filename, 
      line: e.lineno, 
      col: e.colno 
    })
  );
  
  window.addEventListener('unhandledrejection', (e) =>
    console.error('[TRACE] unhandledrejection', e.reason)
  );

  const _fetch = window.fetch;
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    const method = (init?.method ?? (typeof input !== 'string' ? input.method : 'GET')).toUpperCase();
    const safeInit = { ...init };
    // Never log headers/body
    console.log('[TRACE] fetch →', method, url);
    try {
      const res = await _fetch(input, safeInit);
      const ct = res.headers.get('content-type') || '';
      let preview = '';
      if (ct.includes('json')) {
        try { preview = (await res.clone().text()).slice(0, 160); } catch {}
      }
      console.log('[TRACE] fetch ←', res.status, url, { ct, preview });
      return res;
    } catch (err) {
      console.error('[TRACE] fetch ✖', url, err);
      throw err;
    }
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
