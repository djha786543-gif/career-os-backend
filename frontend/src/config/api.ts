export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://career-os-backend-production.up.railway.app/api'

export const api = {
  get: (path: string) => 
    fetch(`${API_BASE}${path}`).then(r => {
      if (!r.ok) throw new Error(`GET ${path} failed: ${r.statusText}`);
      return r.json();
    }),
  post: (path: string, body: unknown) =>
    fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(r => {
      if (!r.ok) throw new Error(`POST ${path} failed: ${r.statusText}`);
      return r.json();
    }),
  patch: (path: string, body: unknown) =>
    fetch(`${API_BASE}${path}`, {
      method: 'PATCH', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(r => {
      if (!r.ok) throw new Error(`PATCH ${path} failed: ${r.statusText}`);
      return r.json();
    }),
  delete: (path: string) =>
    fetch(`${API_BASE}${path}`, { method: 'DELETE' }).then(r => {
      if (!r.ok) throw new Error(`DELETE ${path} failed: ${r.statusText}`);
      return r.json();
    }),
}
