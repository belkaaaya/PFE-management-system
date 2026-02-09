const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request(path, options) {
  try {
    const res = await fetch(`${API_URL}${path}`, options);
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { errors: ['Réponse serveur invalide.'] };
    }
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { errors: [`Impossible de joindre l'API (${API_URL}). Démarrez le serveur backend.`] } };
  }
}

export async function listMyStudents({ teacher_email, role }) {
  const qs = new URLSearchParams();
  qs.set('teacher_email', teacher_email);
  if (role) qs.set('role', role);
  return request(`/api/professor/students?${qs.toString()}`);
}

export async function listMySchedule({ teacher_email, role }) {
  const qs = new URLSearchParams();
  qs.set('teacher_email', teacher_email);
  if (role) qs.set('role', role);
  return request(`/api/professor/schedule?${qs.toString()}`);
}

export async function getSimulatorCriteria() {
  return request(`/api/simulator/criteria`);
}

export async function setSimulatorCriteria(payload) {
  return request(`/api/simulator/criteria`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function saveEvaluation(payload) {
  return request(`/api/evaluations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
