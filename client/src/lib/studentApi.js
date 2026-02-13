import { signup, login } from './api.js'; // keep exports visible if needed
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function getDefense({ email }) {
  const res = await fetch(`${API_URL}/api/defense?email=${encodeURIComponent(email)}`);
  const data = await res.json();
  return { ok: res.ok, data };
}
export async function setDefense(payload) {
  const res = await fetch(`${API_URL}/api/defense`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getReport({ email }) {
  const res = await fetch(`${API_URL}/api/report?email=${encodeURIComponent(email)}`);
  const data = await res.json();
  return { ok: res.ok, data };
}
export async function setReport(payload) {
  const res = await fetch(`${API_URL}/api/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getMessages({ user, peer }) {
  const res = await fetch(`${API_URL}/api/messages?user=${encodeURIComponent(user)}&peer=${encodeURIComponent(peer)}`);
  const data = await res.json();
  return { ok: res.ok, data };
}
export async function sendMessage(payload) {
  const res = await fetch(`${API_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function listSupervisors({ student_email }) {
  const res = await fetch(`${API_URL}/api/student/supervisors?student_email=${encodeURIComponent(student_email)}`);
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function simulateGrade(payload) {
  const res = await fetch(`${API_URL}/api/simulator/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return { ok: res.ok, data };
}
