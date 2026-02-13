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

export async function getStats() {
  return request(`/api/admin/stats`);
}

export async function getPlanningStatus() {
  return request(`/api/admin/planning/status`);
}
export async function setPlanningStatus(payload) {
  return request(`/api/admin/planning/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function listStudents() {
  return request(`/api/admin/students`);
}
export async function addStudent(payload) {
  return request(`/api/admin/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function listTeachers() {
  return request(`/api/admin/teachers`);
}
export async function addTeacher(payload) {
  return request(`/api/admin/teachers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function listRooms() {
  return request(`/api/admin/rooms`);
}
export async function addRoom(payload) {
  return request(`/api/admin/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function listRoomSlots() {
  return request(`/api/admin/rooms/slots`);
}
export async function addRoomSlot(payload) {
  return request(`/api/admin/rooms/slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function addSupervision(payload) {
  return request(`/api/admin/supervisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
export async function listSupervisions(student_email) {
  return request(`/api/admin/supervisions?student_email=${encodeURIComponent(student_email)}`);
}
export async function deleteSupervision(id) {
  return request(`/api/admin/supervisions/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function listSchedule() {
  return request(`/api/admin/schedule`);
}
export async function autoGenerateSchedule() {
  return request(`/api/admin/schedule/auto`, {
    method: 'POST'
  });
}
export async function rescheduleDefense(payload) {
  return request(`/api/admin/schedule/reschedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function listReports(status = 'all') {
  return request(`/api/admin/reports?status=${encodeURIComponent(status)}`);
}
export async function saveReport(payload) {
  return request(`/api/admin/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function listGrades() {
  return request(`/api/admin/grades`);
}
export async function listEvaluations() {
  return request(`/api/admin/evaluations`);
}

export async function listNotificationBatches(limit = 30) {
  return request(`/api/admin/notifications?limit=${encodeURIComponent(limit)}`);
}
export async function sendNotification(payload) {
  return request(`/api/admin/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function deleteStudent(email) {
  return request(`/api/admin/students/${encodeURIComponent(email)}`, { method: 'DELETE' });
}
export async function deleteTeacher(email) {
  return request(`/api/admin/teachers/${encodeURIComponent(email)}`, { method: 'DELETE' });
}
export async function deleteRoom(id) {
  return request(`/api/admin/rooms/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
export async function deleteRoomSlot(id) {
  return request(`/api/admin/rooms/slots/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
export async function deleteSchedule(email) {
  return request(`/api/admin/schedule/${encodeURIComponent(email)}`, { method: 'DELETE' });
}
