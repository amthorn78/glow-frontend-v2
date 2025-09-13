// Runtime-toggled tracing utility
export function traceEnabled(): boolean {
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('trace') === '1') localStorage.setItem('trace', '1');
    if (q.get('trace') === '0') localStorage.removeItem('trace');
    return localStorage.getItem('trace') === '1';
  } catch {
    return false;
  }
}

