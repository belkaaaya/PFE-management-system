import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import {
  db,
  createUser,
  findUserByEmail,
  getDefenseByEmail,
  upsertDefense,
  getReportByEmail,
  upsertReport,
  listMessages,
  addMessage,
  listStudents,
  upsertStudent,
  listTeachers,
  upsertTeacher,
  listRooms,
  addRoom,
  getStats,
  listRoomSlots,
  addRoomSlot,
  reserveRoomSlot,
  getPlanningStatus,
  setPlanningStatus,
  rescheduleDefenseToSlot,
  addSupervision,
  listSupervisionsByStudent,
  deleteSupervisionById,
  listReportsAdmin,
  listGradeSummaries,
  listEvaluationsAdmin,
  listUserEmailsByRole,
  createNotificationBatch,
  addNotificationDeliveries,
  listNotificationBatches,
  listNotificationsForRecipient,
  markAllNotificationsRead,
  deleteUserAccount,
  deleteRoomById,
  deleteRoomSlotById,
  deleteScheduleForStudent,
  hasSupervision,
  listSupervisorsForStudent,
  listStudentsForTeacher,
  getSimulatorCriteria,
  upsertSimulatorCriteria,
  upsertEvaluation
} from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['POST', 'GET', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');
}
function isPassword(v) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v || '');
}
function splitName(fullName) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length <= 1) return { first_name: '', last_name: parts[0] || '' };
  return { first_name: parts.slice(0, -1).join(' '), last_name: parts.slice(-1).join(' ') };
}

app.get('/', (req, res) => {
  res.json({ ok: true, name: 'Planner API' });
});

app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, role, password } = req.body || {};
    const errors = [];
    if (!name || name.trim().length < 2) errors.push('Nom invalide');
    if (!isEmail(email)) errors.push('Email invalide');
    if (!['student','professor','administrator'].includes(role)) errors.push('Rôle invalide');
    if (!isPassword(password)) errors.push('Mot de passe faible');
    if (errors.length) return res.status(400).json({ errors });

    const existing = findUserByEmail(email);
    if (existing) return res.status(409).json({ errors: ['Email déjà utilisé'] });

    const passwordHash = await bcrypt.hash(password, 10);
    const normalizedName = name.trim();
    const normalizedEmail = email.toLowerCase();
    const id = createUser({
      name: normalizedName,
      email: normalizedEmail,
      role,
      passwordHash,
      createdAt: Date.now()
    });

    // Ensure admin lists are populated even if details haven't been completed yet.
    try {
      const { first_name, last_name } = splitName(normalizedName);
      if (role === 'student') {
        upsertStudent({ user_email: normalizedEmail, student_id: '', first_name, last_name, level: '', speciality: '', project_title: '' });
      } else if (role === 'professor') {
        upsertTeacher({ user_email: normalizedEmail, teacher_id: '', first_name, last_name, speciality: '' });
      }
    } catch (e) {
      console.warn('Failed to create initial details row for', normalizedEmail, e);
    }

    return res.status(201).json({ id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ errors: ['Erreur serveur'] });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password, role } = req.body || {};
    const errors = [];
    if (!isEmail(email)) errors.push('Email invalide');
    if (!password) errors.push('Mot de passe requis');
    if (!['student','professor','administrator'].includes(role)) errors.push('Rôle invalide');
    if (errors.length) return res.status(400).json({ errors });
    const user = findUserByEmail(email);
    if (!user) return res.status(401).json({ errors: ['Identifiants incorrects'] });
    if (user.role !== role) return res.status(401).json({ errors: ['Rôle incorrect'] });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ errors: ['Identifiants incorrects'] });
    return res.json({ id: user.id, role: user.role, name: user.name });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ errors: ['Erreur serveur'] });
  }
});

app.get('/api/defense', (req, res) => {
  const email = req.query.email || '';
  if (!isEmail(email)) return res.status(400).json({ errors: ['Email invalide'] });
  const d = getDefenseByEmail(email.toLowerCase());
  return res.json(d || null);
});
app.post('/api/defense', (req, res) => {
  const { email, date, time, classroom, jury } = req.body || {};
  if (!isEmail(email)) return res.status(400).json({ errors: ['Email invalide'] });
  const id = upsertDefense({ user_email: email.toLowerCase(), date, time, classroom, jury });
  return res.json({ id });
});

app.get('/api/report', (req, res) => {
  const email = req.query.email || '';
  if (!isEmail(email)) return res.status(400).json({ errors: ['Email invalide'] });
  const r = getReportByEmail(email.toLowerCase());
  return res.json(r || null);
});
app.post('/api/report', (req, res) => {
  const { email, status, deadline, report_url, memoire_url } = req.body || {};
  if (!isEmail(email)) return res.status(400).json({ errors: ['Email invalide'] });
  if (!['not_submitted','submitted'].includes(status)) return res.status(400).json({ errors: ['Status invalide'] });
  const id = upsertReport({ user_email: email.toLowerCase(), status, deadline, report_url, memoire_url });
  return res.json({ id });
});

app.get('/api/messages', (req, res) => {
  const user = req.query.user || '';
  const peer = req.query.peer || '';
  if (!isEmail(user) || !isEmail(peer)) return res.status(400).json({ errors: ['Paramètres invalides'] });
  const rows = listMessages({ user: user.toLowerCase(), peer: peer.toLowerCase() });
  return res.json(rows);
});
app.post('/api/messages', (req, res) => {
  const { user, peer, content } = req.body || {};
  if (!isEmail(user) || !isEmail(peer) || !content) return res.status(400).json({ errors: ['Paramètres invalides'] });
  const id = addMessage({ user: user.toLowerCase(), peer: peer.toLowerCase(), content, created_at: Date.now() });
  return res.json({ id });
});

app.post('/api/simulator/grade', (req, res) => {
  const { report = 0, defense = 0, internship = 0 } = req.body || {};
  const clamp = v => Math.max(0, Math.min(20, Number(v) || 0));
  const criteria = getSimulatorCriteria();
  const wr0 = Number(criteria.report_weight) || 0;
  const wd0 = Number(criteria.defense_weight) || 0;
  const wi0 = Number(criteria.internship_weight) || 0;
  const sum0 = wr0 + wd0 + wi0;
  const wr = sum0 > 0 ? wr0 / sum0 : 0.4;
  const wd = sum0 > 0 ? wd0 / sum0 : 0.3;
  const wi = sum0 > 0 ? wi0 / sum0 : 0.3;
  const g = wr * clamp(report) + wd * clamp(defense) + wi * clamp(internship);
  const mention = g >= 16 ? 'Très bien' : g >= 14 ? 'Bien' : g >= 12 ? 'Assez bien' : g >= 10 ? 'Passable' : 'Insuffisant';
  return res.json({ grade: g, mention });
});

app.get('/api/simulator/criteria', (req, res) => {
  return res.json(getSimulatorCriteria());
});
app.post('/api/simulator/criteria', (req, res) => {
  try {
    const { report_weight, defense_weight, internship_weight, updated_by } = req.body || {};
    const rw = Number(report_weight);
    const dw = Number(defense_weight);
    const iw = Number(internship_weight);
    if (![rw, dw, iw].every(n => Number.isFinite(n) && n >= 0)) {
      return res.status(400).json({ errors: ['Criteres invalides'] });
    }
    const sum = rw + dw + iw;
    if (sum <= 0) return res.status(400).json({ errors: ['La somme des poids doit etre > 0'] });
    upsertSimulatorCriteria({ report_weight: rw, defense_weight: dw, internship_weight: iw, updated_by });
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ errors: ['Erreur serveur'] });
  }
});

app.get('/api/student/supervisors', (req, res) => {
  const student_email = String(req.query.student_email || '').toLowerCase();
  if (!isEmail(student_email)) return res.status(400).json({ errors: ['Email invalide'] });
  const user = findUserByEmail(student_email);
  if (!user) return res.status(404).json({ errors: ['Utilisateur introuvable'] });
  if (user.role !== 'student') return res.status(400).json({ errors: ["Cet utilisateur n'est pas un etudiant"] });
  return res.json(listSupervisorsForStudent(student_email));
});

app.get('/api/professor/students', (req, res) => {
  const teacher_email = String(req.query.teacher_email || '').toLowerCase();
  const role = String(req.query.role || 'supervisor');
  if (!isEmail(teacher_email)) return res.status(400).json({ errors: ['Email invalide'] });
  if (!['supervisor', 'jury'].includes(role)) return res.status(400).json({ errors: ['Role invalide'] });
  const user = findUserByEmail(teacher_email);
  if (!user) return res.status(404).json({ errors: ['Utilisateur introuvable'] });
  if (user.role !== 'professor') return res.status(400).json({ errors: ["Cet utilisateur n'est pas un enseignant"] });
  return res.json(listStudentsForTeacher({ teacher_email, role }));
});

app.get('/api/professor/schedule', (req, res) => {
  const teacher_email = String(req.query.teacher_email || '').toLowerCase();
  const role = String(req.query.role || 'supervisor');
  if (!isEmail(teacher_email)) return res.status(400).json({ errors: ['Email invalide'] });
  if (!['supervisor', 'jury'].includes(role)) return res.status(400).json({ errors: ['Role invalide'] });
  const user = findUserByEmail(teacher_email);
  if (!user) return res.status(404).json({ errors: ['Utilisateur introuvable'] });
  if (user.role !== 'professor') return res.status(400).json({ errors: ["Cet utilisateur n'est pas un enseignant"] });

  const rows = listStudentsForTeacher({ teacher_email, role })
    .filter(r => r.defense_date && r.defense_time)
    .sort((a, b) => String(a.defense_date).localeCompare(String(b.defense_date)) || String(a.defense_time).localeCompare(String(b.defense_time)));

  return res.json(rows);
});

app.post('/api/evaluations', (req, res) => {
  try {
    const { student_email, evaluator_email, evaluator_role, grade, comment } = req.body || {};
    const st = String(student_email || '').toLowerCase();
    const ev = String(evaluator_email || '').toLowerCase();
    const role = String(evaluator_role || '');
    const g = grade === null || grade === undefined || grade === '' ? null : Number(grade);

    if (!isEmail(st) || !isEmail(ev)) return res.status(400).json({ errors: ['Emails invalides'] });
    if (!['supervisor', 'jury'].includes(role)) return res.status(400).json({ errors: ['Role invalide'] });
    if (g !== null && !(Number.isFinite(g) && g >= 0 && g <= 20)) return res.status(400).json({ errors: ['Note invalide'] });

    if (!hasSupervision({ student_email: st, teacher_email: ev, role })) {
      return res.status(403).json({ errors: ["Vous n'etes pas affecte a cet etudiant (encadrant/jury)."] });
    }

    const id = upsertEvaluation({ student_email: st, evaluator_email: ev, evaluator_role: role, grade: g, comment });
    return res.json({ id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ errors: ['Erreur serveur'] });
  }
});

// Admin APIs
app.get('/api/admin/stats', (req, res) => {
  return res.json(getStats());
});

app.get('/api/admin/planning/status', (req, res) => {
  const s = getPlanningStatus();
  return res.json({
    validated: !!s.validated,
    validated_at: s.validated_at || null,
    validated_by: s.validated_by || null
  });
});
app.post('/api/admin/planning/status', (req, res) => {
  try {
    const { validated, validated_by } = req.body || {};
    const v0 = String(validated).toLowerCase();
    const isTrue = validated === true || validated === 1 || validated === '1' || v0 === 'true';
    const isFalse = validated === false || validated === 0 || validated === '0' || v0 === 'false';
    if (!isTrue && !isFalse) return res.status(400).json({ errors: ['validated invalide'] });
    setPlanningStatus({ validated: isTrue, validated_by });
    const s = getPlanningStatus();
    return res.json({
      ok: true,
      status: {
        validated: !!s.validated,
        validated_at: s.validated_at || null,
        validated_by: s.validated_by || null
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ errors: ['Erreur serveur'] });
  }
});

app.get('/api/admin/reports', (req, res) => {
  const status = String(req.query.status || 'all');
  if (!['all', 'submitted', 'not_submitted'].includes(status)) {
    return res.status(400).json({ errors: ['Status invalide'] });
  }
  return res.json(listReportsAdmin({ status }));
});
app.post('/api/admin/reports', (req, res) => {
  try {
    const { user_email, email, status, deadline, report_url, memoire_url } = req.body || {};
    const rawEmail = String(user_email || email || '').toLowerCase();
    if (!isEmail(rawEmail)) return res.status(400).json({ errors: ['Email invalide'] });
    if (!['not_submitted', 'submitted'].includes(status)) return res.status(400).json({ errors: ['Status invalide'] });
    const user = findUserByEmail(rawEmail);
    if (!user) return res.status(404).json({ errors: ['Utilisateur introuvable'] });
    if (user.role !== 'student') return res.status(400).json({ errors: ["Cet utilisateur n'est pas un etudiant"] });
    const id = upsertReport({
      user_email: rawEmail,
      status,
      deadline: deadline || '',
      report_url: report_url || '',
      memoire_url: memoire_url || ''
    });
    return res.json({ id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ errors: ['Erreur serveur'] });
  }
});

app.get('/api/admin/grades', (req, res) => {
  return res.json(listGradeSummaries());
});
app.get('/api/admin/evaluations', (req, res) => {
  return res.json(listEvaluationsAdmin());
});

app.get('/api/admin/notifications', (req, res) => {
  const limit = req.query.limit;
  return res.json(listNotificationBatches({ limit }));
});
app.post('/api/admin/notifications', (req, res) => {
  try {
    const { title, message, target_type, target_value, created_by } = req.body || {};
    const msg = String(message || '').trim();
    if (!msg) return res.status(400).json({ errors: ['Message requis'] });
    if (!['email', 'role'].includes(target_type)) return res.status(400).json({ errors: ['target_type invalide'] });

    let recipients = [];
    if (target_type === 'email') {
      const email = String(target_value || '').toLowerCase();
      if (!isEmail(email)) return res.status(400).json({ errors: ['Email invalide'] });
      const user = findUserByEmail(email);
      if (!user) return res.status(404).json({ errors: ['Utilisateur introuvable'] });
      recipients = [email];
    } else {
      const role = String(target_value || '').toLowerCase();
      if (!['student', 'professor', 'all'].includes(role)) return res.status(400).json({ errors: ['Rôle cible invalide'] });
      if (role === 'all') {
        recipients = [...listUserEmailsByRole('student'), ...listUserEmailsByRole('professor')];
      } else {
        recipients = listUserEmailsByRole(role);
      }
    }

    if (!recipients.length) return res.status(400).json({ errors: ['Aucun destinataire'] });
    const batch_id = createNotificationBatch({ title, message: msg, target_type, target_value, created_by });
    const deliveries = addNotificationDeliveries({ batch_id, recipient_emails: recipients });
    return res.json({ batch_id, recipients: recipients.length, deliveries });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ errors: ['Erreur serveur'] });
  }
});

app.get('/api/notifications', (req, res) => {
  const email = String(req.query.email || '').toLowerCase();
  const limit = req.query.limit;
  if (!isEmail(email)) return res.status(400).json({ errors: ['Email invalide'] });
  return res.json(listNotificationsForRecipient({ recipient_email: email, limit }));
});
app.post('/api/notifications/read', (req, res) => {
  try {
    const email = String((req.body && req.body.email) || '').toLowerCase();
    if (!isEmail(email)) return res.status(400).json({ errors: ['Email invalide'] });
    const changes = markAllNotificationsRead(email);
    return res.json({ ok: true, changes });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ errors: ['Erreur serveur'] });
  }
});

app.get('/api/admin/students', (req, res) => {
  return res.json(listStudents());
});
app.post('/api/admin/students', (req, res) => {
  (async () => {
    try {
      const { user_email, student_id, first_name, last_name, level, speciality, project_title } = req.body || {};
      if (!isEmail(user_email)) return res.status(400).json({ errors: ['Email invalide'] });
      const email = user_email.toLowerCase();
      const existing = findUserByEmail(email);
      if (!existing) {
        const name = `${(first_name || '').trim()} ${(last_name || '').trim()}`.trim() || email;
        const passwordHash = await bcrypt.hash('Temp1234!', 10);
        createUser({ name, email, role: 'student', passwordHash, createdAt: Date.now() });
      }
      upsertStudent({ user_email: email, student_id, first_name, last_name, level, speciality, project_title });
      return res.json({ ok: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ errors: ["Erreur serveur lors de l'ajout de l'etudiant"] });
    }
  })();
});
app.delete('/api/admin/students/:email', (req, res) => {
  try {
    const email = String(req.params.email || '').toLowerCase();
    if (!isEmail(email)) return res.status(400).json({ errors: ['Email invalide'] });
    const user = findUserByEmail(email);
    if (!user) return res.status(404).json({ errors: ['Utilisateur introuvable'] });
    if (user.role !== 'student') return res.status(400).json({ errors: ["Cet utilisateur n'est pas un etudiant"] });
    deleteUserAccount(email);
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ errors: ['Erreur serveur'] });
  }
});
app.get('/api/admin/teachers', (req, res) => {
  return res.json(listTeachers());
});
app.post('/api/admin/teachers', (req, res) => {
  (async () => {
    try {
      const { user_email, teacher_id, first_name, last_name, speciality } = req.body || {};
      if (!isEmail(user_email)) return res.status(400).json({ errors: ['Email invalide'] });
      const email = user_email.toLowerCase();
      const existing = findUserByEmail(email);
      if (!existing) {
        const name = `${(first_name || '').trim()} ${(last_name || '').trim()}`.trim() || email;
        const passwordHash = await bcrypt.hash('Temp1234!', 10);
        createUser({ name, email, role: 'professor', passwordHash, createdAt: Date.now() });
      }
      upsertTeacher({ user_email: email, teacher_id, first_name, last_name, speciality });
      return res.json({ ok: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ errors: ["Erreur serveur lors de l'ajout de l'enseignant"] });
    }
  })();
});
app.delete('/api/admin/teachers/:email', (req, res) => {
  try {
    const email = String(req.params.email || '').toLowerCase();
    if (!isEmail(email)) return res.status(400).json({ errors: ['Email invalide'] });
    const user = findUserByEmail(email);
    if (!user) return res.status(404).json({ errors: ['Utilisateur introuvable'] });
    if (user.role !== 'professor') return res.status(400).json({ errors: ["Cet utilisateur n'est pas un enseignant"] });
    deleteUserAccount(email);
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ errors: ['Erreur serveur'] });
  }
});
app.get('/api/admin/rooms', (req, res) => {
  return res.json(listRooms());
});
app.post('/api/admin/rooms', (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ errors: ['Nom de salle requis'] });
  const id = addRoom({ name: name.trim() });
  return res.json({ id });
});
app.delete('/api/admin/rooms/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ errors: ['Id invalide'] });
    const changes = deleteRoomById(id);
    if (!changes) return res.status(404).json({ errors: ['Salle introuvable'] });
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ errors: ['Erreur serveur'] });
  }
});

app.get('/api/admin/rooms/slots', (req, res) => {
  return res.json(listRoomSlots());
});
app.post('/api/admin/rooms/slots', (req, res) => {
  const { room_name, day, start, end } = req.body || {};
  if (!room_name || !day || !start || !end) return res.status(400).json({ errors: ['Paramètres manquants'] });
  const id = addRoomSlot({ room_name, day, start, end });
  return res.json({ id });
});
app.delete('/api/admin/rooms/slots/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ errors: ['Id invalide'] });
    const changes = deleteRoomSlotById(id);
    if (!changes) return res.status(404).json({ errors: ['Créneau introuvable'] });
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ errors: ['Erreur serveur'] });
  }
});

app.post('/api/admin/supervisions', (req, res) => {
  const { student_email, teacher_email, role } = req.body || {};
  if (!isEmail(student_email) || !isEmail(teacher_email)) return res.status(400).json({ errors: ['Emails invalides'] });
  if (!['supervisor','jury'].includes(role)) return res.status(400).json({ errors: ['Rôle invalide'] });
  const id = addSupervision({ student_email: student_email.toLowerCase(), teacher_email: teacher_email.toLowerCase(), role });
  return res.json({ id });
});
app.get('/api/admin/supervisions', (req, res) => {
  const student_email = (req.query.student_email || '').toLowerCase();
  if (!isEmail(student_email)) return res.status(400).json({ errors: ['Email invalide'] });
  return res.json(listSupervisionsByStudent(student_email));
});
app.delete('/api/admin/supervisions/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ errors: ['Id invalide'] });
    const changes = deleteSupervisionById(id);
    if (!changes) return res.status(404).json({ errors: ['Affectation introuvable'] });
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ errors: ['Erreur serveur'] });
  }
});

app.get('/api/admin/schedule', (req, res) => {
  const rows = db.prepare(`
    SELECT
      d.date,
      d.time,
      d.classroom AS room,
      rs.id AS slot_id,
      COALESCE(NULLIF(TRIM(COALESCE(sd.first_name, '') || ' ' || COALESCE(sd.last_name, '')), ''), d.user_email) AS student,
      d.user_email AS student_email,
      sd.project_title AS title
    FROM defenses d
    LEFT JOIN student_details sd ON sd.user_email = d.user_email
    LEFT JOIN room_slots rs
      ON rs.reserved_by = d.user_email
     AND rs.day = d.date
     AND rs.room_name = d.classroom
     AND (rs.start || '-' || rs.end) = d.time
    WHERE d.date IS NOT NULL AND d.time IS NOT NULL
    ORDER BY d.date, d.time
  `).all();
  const result = rows.map(r => {
    const sups = listSupervisionsByStudent(r.student_email).filter(x => x.role === 'supervisor').map(x => x.teacher_email);
    const juries = listSupervisionsByStudent(r.student_email).filter(x => x.role === 'jury').map(x => x.teacher_email);
    return { day: r.date, time: r.time, room: r.room, slot_id: r.slot_id || null, student_email: r.student_email, student: r.student, supervisors: sups, juries, title: r.title };
  });
  return res.json(result);
});
app.post('/api/admin/schedule/reschedule', (req, res) => {
  try {
    const { student_email, slot_id } = req.body || {};
    const email = String(student_email || '').toLowerCase();
    if (!isEmail(email)) return res.status(400).json({ errors: ['Email invalide'] });
    const id = Number(slot_id);
    if (!Number.isInteger(id)) return res.status(400).json({ errors: ['slot_id invalide'] });
    const user = findUserByEmail(email);
    if (!user) return res.status(404).json({ errors: ['Utilisateur introuvable'] });
    if (user.role !== 'student') return res.status(400).json({ errors: ["Cet utilisateur n'est pas un etudiant"] });
    const r = rescheduleDefenseToSlot({ student_email: email, slot_id: id });
    if (!r.ok) return res.status(409).json({ errors: r.errors || ['Impossible de planifier'] });
    return res.json({ ok: true, slot: r.slot });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ errors: ['Erreur serveur'] });
  }
});
app.delete('/api/admin/schedule/:email', (req, res) => {
  try {
    const email = String(req.params.email || '').toLowerCase();
    if (!isEmail(email)) return res.status(400).json({ errors: ['Email invalide'] });
    const user = findUserByEmail(email);
    if (!user) return res.status(404).json({ errors: ['Utilisateur introuvable'] });
    if (user.role !== 'student') return res.status(400).json({ errors: ["Cet utilisateur n'est pas un etudiant"] });
    deleteScheduleForStudent(email);
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ errors: ['Erreur serveur'] });
  }
});

app.post('/api/admin/schedule/auto', (req, res) => {
  const students = db.prepare(`
    SELECT
      u.email AS user_email,
      COALESCE(NULLIF(TRIM(COALESCE(sd.first_name, '') || ' ' || COALESCE(sd.last_name, '')), ''), u.name, u.email) AS student,
      sd.project_title AS title
    FROM users u
    LEFT JOIN student_details sd ON sd.user_email = u.email
    WHERE u.role = 'student'
    ORDER BY u.email
  `).all();
  const slots = listRoomSlots().filter(s => !s.reserved_by);
  const created = [];
  for (const st of students) {
    const supervision = listSupervisionsByStudent(st.user_email);
    if (!supervision.length) continue;
    const slot = slots.shift();
    if (!slot) break;
    reserveRoomSlot({ slot_id: slot.id, student_email: st.user_email });
    const sups = supervision.filter(x => x.role === 'supervisor').map(x => x.teacher_email);
    const juries = supervision.filter(x => x.role === 'jury').map(x => x.teacher_email);
    const juryText = [...sups, ...juries].join(', ');
    upsertDefense({ user_email: st.user_email, date: slot.day, time: `${slot.start}-${slot.end}`, classroom: slot.room_name, jury: juryText });
    created.push({ day: slot.day, time: `${slot.start}-${slot.end}`, room: slot.room_name, student: st.student, supervisors: sups, juries, title: st.title });
  }
  return res.json({ created });
});

app.listen(PORT, () => {
  console.log(`Planner API en cours d’exécution: http://localhost:${PORT}/`);
});
