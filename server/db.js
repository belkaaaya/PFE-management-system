import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'monpfe.sqlite');

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('student','professor','administrator')),
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS defenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT NOT NULL,
  date TEXT,
  time TEXT,
  classroom TEXT,
  jury TEXT,
  UNIQUE(user_email)
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('not_submitted','submitted')) DEFAULT 'not_submitted',
  deadline TEXT,
  report_url TEXT,
  memoire_url TEXT,
  UNIQUE(user_email)
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user TEXT NOT NULL,
  peer TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS student_details (
  user_email TEXT PRIMARY KEY,
  student_id TEXT,
  first_name TEXT,
  last_name TEXT,
  level TEXT,
  speciality TEXT,
  advisor_name TEXT,
  advisor_email TEXT,
  project_title TEXT,
  FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teacher_details (
  user_email TEXT PRIMARY KEY,
  teacher_id TEXT,
  first_name TEXT,
  last_name TEXT,
  grade TEXT,
  speciality TEXT,
  FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS jury_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  defense_id INTEGER NOT NULL,
  teacher_email TEXT NOT NULL,
  FOREIGN KEY (defense_id) REFERENCES defenses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS room_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_name TEXT NOT NULL,
  day TEXT NOT NULL,
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  reserved_by TEXT
);

CREATE TABLE IF NOT EXISTS supervisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_email TEXT NOT NULL,
  teacher_email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('supervisor','jury'))
);

CREATE TABLE IF NOT EXISTS simulator_criteria (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  report_weight REAL NOT NULL,
  defense_weight REAL NOT NULL,
  internship_weight REAL NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_email TEXT NOT NULL,
  evaluator_email TEXT NOT NULL,
  evaluator_role TEXT NOT NULL CHECK (evaluator_role IN ('supervisor','jury')),
  grade REAL CHECK (grade IS NULL OR (grade >= 0 AND grade <= 20)),
  comment TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(student_email, evaluator_email, evaluator_role),
  FOREIGN KEY (student_email) REFERENCES users(email) ON DELETE CASCADE,
  FOREIGN KEY (evaluator_email) REFERENCES users(email) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS grade_publications (
  student_email TEXT PRIMARY KEY,
  published_at INTEGER NOT NULL,
  published_by TEXT,
  FOREIGN KEY (student_email) REFERENCES users(email) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS planning_status (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  validated INTEGER NOT NULL DEFAULT 0,
  validated_at INTEGER,
  validated_by TEXT
);

CREATE TABLE IF NOT EXISTS document_deadlines (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  report_deadline TEXT,
  memoire_deadline TEXT,
  updated_at INTEGER,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS notification_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  message TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('email','role')),
  target_value TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  recipient_email TEXT NOT NULL,
  read_at INTEGER,
  UNIQUE(batch_id, recipient_email),
  FOREIGN KEY (batch_id) REFERENCES notification_batches(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS notification_deliveries_recipient_idx
  ON notification_deliveries(recipient_email, read_at, id);
`);

const studentDetailsColumns = db.prepare(`PRAGMA table_info(student_details)`).all().map((row) => String(row.name || ''));
if (!studentDetailsColumns.includes('profile_completed')) {
  db.exec(`ALTER TABLE student_details ADD COLUMN profile_completed INTEGER NOT NULL DEFAULT 0`);
}
if (!studentDetailsColumns.includes('advisor_name')) {
  db.exec(`ALTER TABLE student_details ADD COLUMN advisor_name TEXT`);
}
if (!studentDetailsColumns.includes('advisor_email')) {
  db.exec(`ALTER TABLE student_details ADD COLUMN advisor_email TEXT`);
}
if (!studentDetailsColumns.includes('profile_picture_url')) {
  db.exec(`ALTER TABLE student_details ADD COLUMN profile_picture_url TEXT`);
}
const teacherDetailsColumns = db.prepare(`PRAGMA table_info(teacher_details)`).all().map((row) => String(row.name || ''));
if (!teacherDetailsColumns.includes('grade')) {
  db.exec(`ALTER TABLE teacher_details ADD COLUMN grade TEXT`);
}
if (!teacherDetailsColumns.includes('profile_completed')) {
  db.exec(`ALTER TABLE teacher_details ADD COLUMN profile_completed INTEGER NOT NULL DEFAULT 0`);
}

// Backfill rooms table from existing data so the admin "Rooms" list is never empty when slots/defenses exist.
db.exec(`
INSERT OR IGNORE INTO rooms (name)
SELECT DISTINCT TRIM(room_name)
FROM room_slots
WHERE TRIM(COALESCE(room_name, '')) <> '';
`);
db.exec(`
INSERT OR IGNORE INTO rooms (name)
SELECT DISTINCT TRIM(classroom)
FROM defenses
WHERE TRIM(COALESCE(classroom, '')) <> '';
`);

function splitCsv(v) {
  return String(v || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function timeToMinutes(hhmm) {
  const m = String(hhmm || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isInteger(h) || !Number.isInteger(mm)) return null;
  if (h < 0 || h > 23 || mm < 0 || mm > 59) return null;
  return h * 60 + mm;
}

function parseTimeRange(v) {
  const raw = String(v || '').trim();
  const parts = raw.split('-').map(s => s.trim()).filter(Boolean);
  if (parts.length !== 2) return null;
  const startMin = timeToMinutes(parts[0]);
  const endMin = timeToMinutes(parts[1]);
  if (startMin === null || endMin === null) return null;
  if (endMin <= startMin) return null;
  return { startMin, endMin };
}

export function createUser({ name, email, role, passwordHash, createdAt }) {
  const stmt = db.prepare(`
    INSERT INTO users (name, email, role, password_hash, created_at)
    VALUES (@name, @email, @role, @passwordHash, @createdAt)
  `);
  const info = stmt.run({ name, email, role, passwordHash, createdAt });
  return info.lastInsertRowid;
}

export function findUserByEmail(email) {
  const stmt = db.prepare(`SELECT * FROM users WHERE email = ?`);
  return stmt.get(email);
}

export function getDefenseByEmail(email) {
  const stmt = db.prepare(`SELECT * FROM defenses WHERE user_email = ?`);
  return stmt.get(email);
}
export function upsertDefense({ user_email, date, time, classroom, jury }) {
  const exists = getDefenseByEmail(user_email);
  if (exists) {
    const stmt = db.prepare(`UPDATE defenses SET date=@date, time=@time, classroom=@classroom, jury=@jury WHERE user_email=@user_email`);
    stmt.run({ user_email, date, time, classroom, jury });
    return exists.id;
  } else {
    const stmt = db.prepare(`INSERT INTO defenses (user_email, date, time, classroom, jury) VALUES (@user_email, @date, @time, @classroom, @jury)`);
    const info = stmt.run({ user_email, date, time, classroom, jury });
    return info.lastInsertRowid;
  }
}

export function getReportByEmail(email) {
  const stmt = db.prepare(`SELECT * FROM reports WHERE user_email = ?`);
  return stmt.get(email);
}
export function upsertReport({ user_email, status, deadline, report_url, memoire_url }) {
  const exists = getReportByEmail(user_email);
  if (exists) {
    const stmt = db.prepare(`UPDATE reports SET status=@status, deadline=@deadline, report_url=@report_url, memoire_url=@memoire_url WHERE user_email=@user_email`);
    stmt.run({ user_email, status, deadline, report_url, memoire_url });
    return exists.id;
  } else {
    const stmt = db.prepare(`INSERT INTO reports (user_email, status, deadline, report_url, memoire_url) VALUES (@user_email, @status, @deadline, @report_url, @memoire_url)`);
    const info = stmt.run({ user_email, status, deadline, report_url, memoire_url });
    return info.lastInsertRowid;
  }
}

export function listMessages({ user, peer }) {
  const stmt = db.prepare(`
    SELECT id, user, peer, content, created_at
    FROM messages
    WHERE (user=@user AND peer=@peer) OR (user=@peer AND peer=@user)
    ORDER BY created_at ASC, id ASC
  `);
  return stmt.all({ user, peer });
}
export function addMessage({ user, peer, content, created_at }) {
  const stmt = db.prepare(`INSERT INTO messages (user, peer, content, created_at) VALUES (@user, @peer, @content, @created_at)`);
  const info = stmt.run({ user, peer, content, created_at });
  return info.lastInsertRowid;
}

export function listStudents() {
  // Include all student accounts, even if their details haven't been filled yet.
  return db.prepare(`
    SELECT
      u.email AS user_email,
      u.name  AS account_name,
      sd.student_id,
      sd.first_name,
      sd.last_name,
      sd.level,
      sd.speciality,
      sd.advisor_name,
      sd.advisor_email,
      sd.project_title,
      sd.profile_picture_url,
      sd.profile_completed,
      r.status AS report_status,
      r.deadline AS report_deadline,
      r.report_url,
      r.memoire_url
    FROM users u
    LEFT JOIN student_details sd ON sd.user_email = u.email
    LEFT JOIN reports r ON r.user_email = u.email
    WHERE u.role = 'student'
    ORDER BY COALESCE(sd.last_name, u.name), COALESCE(sd.first_name, '')
  `).all();
}

export function getStudentByEmail(email) {
  return db.prepare(`
    SELECT
      u.email AS user_email,
      u.name AS account_name,
      sd.student_id,
      sd.first_name,
      sd.last_name,
      sd.level,
      sd.speciality,
      sd.advisor_name,
      sd.advisor_email,
      sd.project_title,
      sd.profile_picture_url,
      sd.profile_completed
    FROM users u
    LEFT JOIN student_details sd ON sd.user_email = u.email
    WHERE u.role = 'student' AND u.email = @email
    LIMIT 1
  `).get({ email });
}

export function upsertStudent(d) {
  const exists = db.prepare(`
    SELECT user_email, profile_completed, advisor_name, advisor_email, profile_picture_url
    FROM student_details
    WHERE user_email = ?
  `).get(d.user_email);
  const hasAllRequiredFields =
    !!String((d && d.first_name) || '').trim() &&
    !!String((d && d.last_name) || '').trim() &&
    !!String((d && d.student_id) || '').trim() &&
    !!String((d && d.level) || '').trim() &&
    !!String((d && d.speciality) || '').trim() &&
    !!String((d && d.project_title) || '').trim();
  const profileCompleted =
    d && d.profile_completed !== undefined && d.profile_completed !== null
      ? (Number(d.profile_completed) ? 1 : 0)
      : hasAllRequiredFields
        ? 1
        : (exists && Number(exists.profile_completed)) || 0;
  const payload = {
    user_email: d.user_email,
    student_id: d.student_id,
    first_name: d.first_name,
    last_name: d.last_name,
    level: d.level,
    speciality: d.speciality,
    advisor_name:
      d && d.advisor_name !== undefined && d.advisor_name !== null
        ? String(d.advisor_name || '')
        : String((exists && exists.advisor_name) || ''),
    advisor_email:
      d && d.advisor_email !== undefined && d.advisor_email !== null
        ? String(d.advisor_email || '')
        : String((exists && exists.advisor_email) || ''),
    profile_picture_url:
      d && d.profile_picture_url !== undefined && d.profile_picture_url !== null
        ? String(d.profile_picture_url || '')
        : String((exists && exists.profile_picture_url) || ''),
    project_title: d.project_title,
    profile_completed: profileCompleted
  };
  if (exists) {
    const stmt = db.prepare(`
      UPDATE student_details
      SET
        student_id=@student_id,
        first_name=@first_name,
        last_name=@last_name,
        level=@level,
        speciality=@speciality,
        advisor_name=@advisor_name,
        advisor_email=@advisor_email,
        profile_picture_url=@profile_picture_url,
        project_title=@project_title,
        profile_completed=@profile_completed
      WHERE user_email=@user_email
    `);
    stmt.run(payload);
    return d.user_email;
  } else {
    const stmt = db.prepare(`
      INSERT INTO student_details
      (
        user_email,
        student_id,
        first_name,
        last_name,
        level,
        speciality,
        advisor_name,
        advisor_email,
        profile_picture_url,
        project_title,
        profile_completed
      )
      VALUES (
        @user_email,
        @student_id,
        @first_name,
        @last_name,
        @level,
        @speciality,
        @advisor_name,
        @advisor_email,
        @profile_picture_url,
        @project_title,
        @profile_completed
      )
    `);
    stmt.run(payload);
    return d.user_email;
  }
}

export function listTeachers() {
  // Include all professor accounts, even if their details haven't been filled yet.
  return db.prepare(`
    SELECT
      u.email AS user_email,
      u.name  AS account_name,
      td.teacher_id,
      td.first_name,
      td.last_name,
      td.grade,
      td.speciality,
      td.profile_completed
    FROM users u
    LEFT JOIN teacher_details td ON td.user_email = u.email
    WHERE u.role = 'professor'
    ORDER BY COALESCE(td.last_name, u.name), COALESCE(td.first_name, '')
  `).all();
}
export function getTeacherByEmail(email) {
  return db.prepare(`
    SELECT
      u.email AS user_email,
      u.name AS account_name,
      td.teacher_id,
      td.first_name,
      td.last_name,
      td.grade,
      td.speciality,
      td.profile_completed
    FROM users u
    LEFT JOIN teacher_details td ON td.user_email = u.email
    WHERE u.role = 'professor' AND u.email = @email
    LIMIT 1
  `).get({ email });
}
export function upsertTeacher(d) {
  const exists = db.prepare(`
    SELECT user_email, grade, profile_completed
    FROM teacher_details
    WHERE user_email = ?
  `).get(d.user_email);
  const hasAllRequiredFields =
    !!String((d && d.first_name) || '').trim() &&
    !!String((d && d.last_name) || '').trim() &&
    !!String((d && d.teacher_id) || '').trim() &&
    !!String((d && d.grade) || '').trim() &&
    !!String((d && d.speciality) || '').trim();
  const profileCompleted =
    d && d.profile_completed !== undefined && d.profile_completed !== null
      ? (Number(d.profile_completed) ? 1 : 0)
      : hasAllRequiredFields
        ? 1
        : (exists && Number(exists.profile_completed)) || 0;
  const payload = {
    user_email: String((d && d.user_email) || '').toLowerCase(),
    teacher_id:
      d && d.teacher_id !== undefined && d.teacher_id !== null
        ? String(d.teacher_id || '')
        : '',
    first_name:
      d && d.first_name !== undefined && d.first_name !== null
        ? String(d.first_name || '')
        : '',
    last_name:
      d && d.last_name !== undefined && d.last_name !== null
        ? String(d.last_name || '')
        : '',
    grade:
      d && d.grade !== undefined && d.grade !== null
        ? String(d.grade || '')
        : String((exists && exists.grade) || ''),
    speciality:
      d && d.speciality !== undefined && d.speciality !== null
        ? String(d.speciality || '')
        : '',
    profile_completed: profileCompleted
  };
  if (exists) {
    const stmt = db.prepare(`
      UPDATE teacher_details
      SET
        teacher_id=@teacher_id,
        first_name=@first_name,
        last_name=@last_name,
        grade=@grade,
        speciality=@speciality,
        profile_completed=@profile_completed
      WHERE user_email=@user_email
    `);
    stmt.run(payload);
    return d.user_email;
  } else {
    const stmt = db.prepare(`
      INSERT INTO teacher_details
      (user_email, teacher_id, first_name, last_name, grade, speciality, profile_completed)
      VALUES (@user_email, @teacher_id, @first_name, @last_name, @grade, @speciality, @profile_completed)
    `);
    stmt.run(payload);
    return d.user_email;
  }
}

export function listRooms() {
  db.exec(`
  INSERT OR IGNORE INTO rooms (name)
  SELECT DISTINCT TRIM(room_name)
  FROM room_slots
  WHERE TRIM(COALESCE(room_name, '')) <> '';
  `);
  db.exec(`
  INSERT OR IGNORE INTO rooms (name)
  SELECT DISTINCT TRIM(classroom)
  FROM defenses
  WHERE TRIM(COALESCE(classroom, '')) <> '';
  `);
  return db.prepare(`SELECT * FROM rooms ORDER BY name`).all();
}
export function addRoom({ name }) {
  const info = db.prepare(`INSERT INTO rooms (name) VALUES (?)`).run(name);
  return info.lastInsertRowid;
}

export function listRoomSlots() {
  return db.prepare(`SELECT * FROM room_slots ORDER BY day, start`).all();
}
export function addRoomSlot({ room_name, day, start, end }) {
  const normalizedRoom = String(room_name || '').trim();
  if (normalizedRoom) {
    db.prepare(`INSERT OR IGNORE INTO rooms (name) VALUES (?)`).run(normalizedRoom);
  }
  const info = db.prepare(`INSERT INTO room_slots (room_name, day, start, end) VALUES (@room_name, @day, @start, @end)`).run({
    room_name: normalizedRoom,
    day,
    start,
    end
  });
  return info.lastInsertRowid;
}
export function syncRoomSlotForDefense({ student_email, day, time, room_name }) {
  const email = String(student_email || '').trim().toLowerCase();
  const targetDay = String(day || '').trim();
  const targetTime = String(time || '').trim();
  const targetRoom = String(room_name || '').trim();
  const parts = targetTime.split('-').map(s => s.trim()).filter(Boolean);
  const parsedRange = parseTimeRange(targetTime);
  const start = parts[0] || '';
  const end = parts[1] || '';

  if (!email || !targetDay || !targetRoom || !parsedRange || !start || !end) {
    return { ok: false, slot_id: null, reserved: false, shared: false };
  }

  const tx = db.transaction(() => {
    // Keep room catalog in sync with manually entered defenses.
    db.prepare(`INSERT OR IGNORE INTO rooms (name) VALUES (?)`).run(targetRoom);

    const existingSlot = db.prepare(`
      SELECT id, reserved_by
      FROM room_slots
      WHERE room_name=@room_name AND day=@day AND start=@start AND end=@end
      LIMIT 1
    `).get({ room_name: targetRoom, day: targetDay, start, end });

    let slotId = null;
    let reserved = false;
    let shared = false;

    if (!existingSlot) {
      const info = db.prepare(`
        INSERT INTO room_slots (room_name, day, start, end, reserved_by)
        VALUES (@room_name, @day, @start, @end, @reserved_by)
      `).run({ room_name: targetRoom, day: targetDay, start, end, reserved_by: email });
      slotId = Number(info.lastInsertRowid);
      reserved = true;
    } else {
      slotId = Number(existingSlot.id);
      if (!existingSlot.reserved_by || existingSlot.reserved_by === email) {
        db.prepare(`UPDATE room_slots SET reserved_by=@student_email WHERE id=@slot_id`).run({ student_email: email, slot_id: slotId });
        reserved = true;
      } else {
        // Another student already owns this slot: keep it (group/shared defense case).
        shared = true;
      }
    }

    if (reserved && slotId) {
      db.prepare(`UPDATE room_slots SET reserved_by = NULL WHERE reserved_by = ? AND id <> ?`).run(email, slotId);
    } else {
      db.prepare(`UPDATE room_slots SET reserved_by = NULL WHERE reserved_by = ?`).run(email);
    }

    return { ok: true, slot_id: slotId || null, reserved, shared };
  });

  return tx();
}
export function reserveRoomSlot({ slot_id, student_email }) {
  const info = db.prepare(`UPDATE room_slots SET reserved_by=@student_email WHERE id=@slot_id AND reserved_by IS NULL`).run({ slot_id, student_email });
  return info.changes;
}

export function getRoomSlotById(slot_id) {
  return db.prepare(`SELECT * FROM room_slots WHERE id = ?`).get(slot_id);
}

export function rescheduleDefenseToSlot({ student_email, slot_id }) {
  const tx = db.transaction(({ student_email, slot_id }) => {
    const slot = getRoomSlotById(slot_id);
    if (!slot) return { ok: false, errors: ['Créneau introuvable'] };
    if (slot.reserved_by && slot.reserved_by !== student_email) {
      return { ok: false, errors: ['Créneau déjà réservé'] };
    }

    if (slot.room_name) {
      db.prepare(`INSERT OR IGNORE INTO rooms (name) VALUES (?)`).run(String(slot.room_name).trim());
    }

    // Release any other slot reserved by this student, and reserve the new one.
    db.prepare(`UPDATE room_slots SET reserved_by = NULL WHERE reserved_by = ? AND id <> ?`).run(student_email, slot_id);
    db.prepare(`UPDATE room_slots SET reserved_by = ? WHERE id = ?`).run(student_email, slot_id);

    const juryText = db.prepare(`
      SELECT GROUP_CONCAT(teacher_email) AS t
      FROM supervisions
      WHERE student_email = ?
    `).get(student_email)?.t;

    const time = `${slot.start}-${slot.end}`;
    upsertDefense({ user_email: student_email, date: slot.day, time, classroom: slot.room_name, jury: juryText || '' });

    return { ok: true, slot: { id: slot.id, room_name: slot.room_name, day: slot.day, start: slot.start, end: slot.end } };
  });

  return tx({ student_email, slot_id });
}

export function addSupervision({ student_email, teacher_email, role }) {
  const existing = db.prepare(`
    SELECT id
    FROM supervisions
    WHERE student_email=@student_email AND teacher_email=@teacher_email AND role=@role
    LIMIT 1
  `).get({ student_email, teacher_email, role });
  if (existing) return existing.id;
  const info = db.prepare(`INSERT INTO supervisions (student_email, teacher_email, role) VALUES (@student_email, @teacher_email, @role)`).run({ student_email, teacher_email, role });
  return info.lastInsertRowid;
}
export function listSupervisionsByStudent(student_email) {
  return db.prepare(`SELECT id, teacher_email, role FROM supervisions WHERE student_email=@student_email ORDER BY role, teacher_email`).all({ student_email });
}
export function deleteSupervisionById(id) {
  const info = db.prepare(`DELETE FROM supervisions WHERE id = ?`).run(id);
  return info.changes;
}
export function hasSupervision({ student_email, teacher_email, role }) {
  const row = db.prepare(`
    SELECT 1 AS ok
    FROM supervisions
    WHERE student_email=@student_email AND teacher_email=@teacher_email AND role=@role
    LIMIT 1
  `).get({ student_email, teacher_email, role });
  return !!row;
}

export function listSupervisorsForStudent(student_email, role = 'supervisor') {
  const roleFilter = role === 'all' ? null : role;
  return db.prepare(`
    SELECT
      s.teacher_email,
      s.role,
      COALESCE(
        NULLIF(TRIM(COALESCE(td.first_name, '') || ' ' || COALESCE(td.last_name, '')), ''),
        u.name,
        s.teacher_email
      ) AS teacher_name
    FROM supervisions s
    LEFT JOIN users u ON u.email = s.teacher_email
    LEFT JOIN teacher_details td ON td.user_email = s.teacher_email
    WHERE s.student_email=@student_email
      AND (@role IS NULL OR s.role=@role)
    ORDER BY CASE WHEN s.role='supervisor' THEN 0 ELSE 1 END, teacher_name
  `).all({ student_email, role: roleFilter });
}

export function listStudentsForTeacher({ teacher_email, role = 'supervisor' }) {
  const roleFilter = role === 'all' ? null : role;
  const rows = db.prepare(`
    SELECT
      s.student_email,
      s.role AS supervision_role,
      COALESCE(
        NULLIF(TRIM(COALESCE(sd.first_name, '') || ' ' || COALESCE(sd.last_name, '')), ''),
        u.name,
        s.student_email
      ) AS student_name,
      sd.project_title,
      sd.level,
      sd.speciality,
      r.status AS report_status,
      r.deadline AS report_deadline,
      r.report_url,
      r.memoire_url,
      d.date AS defense_date,
      d.time AS defense_time,
      d.classroom AS defense_room,
      (SELECT GROUP_CONCAT(teacher_email) FROM supervisions WHERE student_email=s.student_email AND role='supervisor') AS supervisors,
      (SELECT GROUP_CONCAT(teacher_email) FROM supervisions WHERE student_email=s.student_email AND role='jury') AS juries,
      e.grade AS eval_grade,
      e.comment AS eval_comment,
      e.updated_at AS eval_updated_at
    FROM supervisions s
    LEFT JOIN users u ON u.email = s.student_email
    LEFT JOIN student_details sd ON sd.user_email = s.student_email
    LEFT JOIN reports r ON r.user_email = s.student_email
    LEFT JOIN defenses d ON d.user_email = s.student_email
    LEFT JOIN evaluations e
      ON e.student_email = s.student_email
     AND e.evaluator_email = s.teacher_email
     AND e.evaluator_role = s.role
    WHERE s.teacher_email=@teacher_email
      AND (@role IS NULL OR s.role=@role)
    ORDER BY student_name, s.role
  `).all({ teacher_email, role: roleFilter });

  return rows.map(r => ({
    ...r,
    supervisors: splitCsv(r.supervisors),
    juries: splitCsv(r.juries)
  }));
}

export function getSimulatorCriteria() {
  const row = db.prepare(`
    SELECT report_weight, defense_weight, internship_weight, updated_at, updated_by
    FROM simulator_criteria
    WHERE id = 1
  `).get();
  if (row) return row;
  return {
    report_weight: 0.4,
    defense_weight: 0.3,
    internship_weight: 0.3,
    updated_at: null,
    updated_by: null
  };
}

export function upsertSimulatorCriteria({ report_weight, defense_weight, internship_weight, updated_by }) {
  const now = Date.now();
  const exists = db.prepare(`SELECT id FROM simulator_criteria WHERE id = 1`).get();
  if (exists) {
    db.prepare(`
      UPDATE simulator_criteria
      SET report_weight=@report_weight, defense_weight=@defense_weight, internship_weight=@internship_weight, updated_at=@updated_at, updated_by=@updated_by
      WHERE id = 1
    `).run({ report_weight, defense_weight, internship_weight, updated_at: now, updated_by: updated_by || null });
    return 1;
  }

  db.prepare(`
    INSERT INTO simulator_criteria (id, report_weight, defense_weight, internship_weight, updated_at, updated_by)
    VALUES (1, @report_weight, @defense_weight, @internship_weight, @updated_at, @updated_by)
  `).run({ report_weight, defense_weight, internship_weight, updated_at: now, updated_by: updated_by || null });
  return 1;
}

export function upsertEvaluation({ student_email, evaluator_email, evaluator_role, grade, comment }) {
  const now = Date.now();
  const exists = db.prepare(`
    SELECT id
    FROM evaluations
    WHERE student_email=@student_email AND evaluator_email=@evaluator_email AND evaluator_role=@evaluator_role
  `).get({ student_email, evaluator_email, evaluator_role });

  if (exists) {
    db.prepare(`
      UPDATE evaluations
      SET grade=@grade, comment=@comment, updated_at=@updated_at
      WHERE id=@id
    `).run({ id: exists.id, grade, comment: comment || null, updated_at: now });
    return exists.id;
  }

  const info = db.prepare(`
    INSERT INTO evaluations (student_email, evaluator_email, evaluator_role, grade, comment, created_at, updated_at)
    VALUES (@student_email, @evaluator_email, @evaluator_role, @grade, @comment, @created_at, @updated_at)
  `).run({
    student_email,
    evaluator_email,
    evaluator_role,
    grade,
    comment: comment || null,
    created_at: now,
    updated_at: now
  });
  return info.lastInsertRowid;
}

export function getPlanningStatus() {
  const row = db.prepare(`
    SELECT validated, validated_at, validated_by
    FROM planning_status
    WHERE id = 1
  `).get();
  if (row) return row;
  return { validated: 0, validated_at: null, validated_by: null };
}

export function setPlanningStatus({ validated, validated_by }) {
  const now = Date.now();
  const v = validated ? 1 : 0;
  const validated_at = v ? now : null;
  const validated_by_value = v ? (validated_by || null) : null;
  const exists = db.prepare(`SELECT id FROM planning_status WHERE id = 1`).get();
  if (exists) {
    db.prepare(`
      UPDATE planning_status
      SET validated=@validated, validated_at=@validated_at, validated_by=@validated_by
      WHERE id = 1
    `).run({ validated: v, validated_at, validated_by: validated_by_value });
    return 1;
  }

  db.prepare(`
    INSERT INTO planning_status (id, validated, validated_at, validated_by)
    VALUES (1, @validated, @validated_at, @validated_by)
  `).run({ validated: v, validated_at, validated_by: validated_by_value });
  return 1;
}

export function getDocumentDeadlines() {
  const row = db.prepare(`
    SELECT report_deadline, memoire_deadline, updated_at, updated_by
    FROM document_deadlines
    WHERE id = 1
  `).get();
  if (row) return row;
  return { report_deadline: '', memoire_deadline: '', updated_at: null, updated_by: null };
}

export function setDocumentDeadlines({ report_deadline, memoire_deadline, updated_by }) {
  const now = Date.now();
  const payload = {
    report_deadline: report_deadline || '',
    memoire_deadline: memoire_deadline || '',
    updated_at: now,
    updated_by: updated_by || null
  };
  const exists = db.prepare(`SELECT id FROM document_deadlines WHERE id = 1`).get();
  if (exists) {
    db.prepare(`
      UPDATE document_deadlines
      SET report_deadline=@report_deadline, memoire_deadline=@memoire_deadline, updated_at=@updated_at, updated_by=@updated_by
      WHERE id = 1
    `).run(payload);
    return 1;
  }
  db.prepare(`
    INSERT INTO document_deadlines (id, report_deadline, memoire_deadline, updated_at, updated_by)
    VALUES (1, @report_deadline, @memoire_deadline, @updated_at, @updated_by)
  `).run(payload);
  return 1;
}

export function listUserEmailsByRole(role) {
  return db
    .prepare(`SELECT email FROM users WHERE role = ? ORDER BY email`)
    .all(role)
    .map(r => r.email);
}

export function listReportsAdmin({ status = 'all' } = {}) {
  const st = String(status || 'all');
  return db.prepare(`
    SELECT
      u.email AS student_email,
      COALESCE(
        NULLIF(TRIM(COALESCE(sd.first_name, '') || ' ' || COALESCE(sd.last_name, '')), ''),
        u.name,
        u.email
      ) AS student_name,
      COALESCE(r.status, 'not_submitted') AS status,
      r.deadline,
      r.report_url,
      r.memoire_url,
      d.date AS defense_date,
      d.time AS defense_time,
      d.classroom AS defense_room
    FROM users u
    LEFT JOIN student_details sd ON sd.user_email = u.email
    LEFT JOIN reports r ON r.user_email = u.email
    LEFT JOIN defenses d ON d.user_email = u.email
    WHERE u.role = 'student'
      AND (@status = 'all' OR COALESCE(r.status, 'not_submitted') = @status)
    ORDER BY status, student_name
  `).all({ status: st });
}

function gradeBucketKey(g) {
  if (g >= 16) return 'tresBien';
  if (g >= 14) return 'bien';
  if (g >= 12) return 'assezBien';
  if (g >= 10) return 'passable';
  return 'insuffisant';
}

function mentionFromGradeValue(g) {
  if (g >= 16) return 'Tres bien';
  if (g >= 14) return 'Bien';
  if (g >= 12) return 'Assez bien';
  if (g >= 10) return 'Passable';
  return 'Insuffisant';
}

export function listGradeSummaries() {
  const rows = db.prepare(`
    SELECT
      u.email AS student_email,
      COALESCE(
        NULLIF(TRIM(COALESCE(sd.first_name, '') || ' ' || COALESCE(sd.last_name, '')), ''),
        u.name,
        u.email
      ) AS student_name,
      AVG(e.grade) AS avg_grade,
      COUNT(e.grade) AS grades_count
    FROM users u
    LEFT JOIN student_details sd ON sd.user_email = u.email
    LEFT JOIN evaluations e ON e.student_email = u.email AND e.grade IS NOT NULL
    WHERE u.role = 'student'
    GROUP BY u.email
    ORDER BY student_name
  `).all();

  return rows.map(r => {
    const g = r.avg_grade === null || r.avg_grade === undefined ? null : Number(r.avg_grade);
    return {
      student_email: r.student_email,
      student_name: r.student_name,
      avg_grade: Number.isFinite(g) ? g : null,
      grades_count: Number(r.grades_count) || 0,
      bucket: Number.isFinite(g) ? gradeBucketKey(g) : null
    };
  });
}

export function listFinalGradesAdmin() {
  const rows = db.prepare(`
    SELECT
      u.email AS student_email,
      COALESCE(
        NULLIF(TRIM(COALESCE(sd.first_name, '') || ' ' || COALESCE(sd.last_name, '')), ''),
        u.name,
        u.email
      ) AS student_name,
      AVG(e.grade) AS avg_grade,
      COUNT(e.grade) AS grades_count,
      gp.published_at,
      gp.published_by
    FROM users u
    LEFT JOIN student_details sd ON sd.user_email = u.email
    LEFT JOIN evaluations e ON e.student_email = u.email AND e.grade IS NOT NULL
    LEFT JOIN grade_publications gp ON gp.student_email = u.email
    WHERE u.role = 'student'
    GROUP BY u.email
    ORDER BY student_name
  `).all();

  return rows.map((r) => {
    const g = r.avg_grade === null || r.avg_grade === undefined ? null : Number(r.avg_grade);
    return {
      student_email: r.student_email,
      student_name: r.student_name,
      avg_grade: Number.isFinite(g) ? g : null,
      grades_count: Number(r.grades_count) || 0,
      mention: Number.isFinite(g) ? mentionFromGradeValue(g) : null,
      published: !!Number(r.published_at),
      published_at: r.published_at || null,
      published_by: r.published_by || null
    };
  });
}

export function setFinalGradePublication({ student_email, published, published_by }) {
  const email = String(student_email || '').toLowerCase();
  const tx = db.transaction(({ email, published, published_by }) => {
    if (published) {
      const now = Date.now();
      db.prepare(`
        INSERT INTO grade_publications (student_email, published_at, published_by)
        VALUES (@student_email, @published_at, @published_by)
        ON CONFLICT(student_email)
        DO UPDATE SET published_at = excluded.published_at, published_by = excluded.published_by
      `).run({
        student_email: email,
        published_at: now,
        published_by: published_by || null
      });
      return { changes: 1, published_at: now };
    }
    const info = db.prepare(`DELETE FROM grade_publications WHERE student_email = @student_email`).run({ student_email: email });
    return { changes: info.changes, published_at: null };
  });
  return tx({ email, published: !!published, published_by });
}

export function getPublishedFinalGradeForStudent(student_email) {
  const email = String(student_email || '').toLowerCase();
  const row = db.prepare(`
    SELECT
      u.email AS student_email,
      COALESCE(
        NULLIF(TRIM(COALESCE(sd.first_name, '') || ' ' || COALESCE(sd.last_name, '')), ''),
        u.name,
        u.email
      ) AS student_name,
      AVG(e.grade) AS avg_grade,
      COUNT(e.grade) AS grades_count,
      gp.published_at,
      gp.published_by
    FROM users u
    LEFT JOIN student_details sd ON sd.user_email = u.email
    LEFT JOIN evaluations e ON e.student_email = u.email AND e.grade IS NOT NULL
    JOIN grade_publications gp ON gp.student_email = u.email
    WHERE u.role = 'student' AND u.email = @email
    GROUP BY u.email
    LIMIT 1
  `).get({ email });

  if (!row) return null;
  const g = row.avg_grade === null || row.avg_grade === undefined ? null : Number(row.avg_grade);
  return {
    student_email: row.student_email,
    student_name: row.student_name,
    avg_grade: Number.isFinite(g) ? g : null,
    grades_count: Number(row.grades_count) || 0,
    mention: Number.isFinite(g) ? mentionFromGradeValue(g) : null,
    published_at: row.published_at || null,
    published_by: row.published_by || null
  };
}

export function listEvaluationsAdmin() {
  return db.prepare(`
    SELECT student_email, evaluator_email, evaluator_role, grade, comment, updated_at
    FROM evaluations
    ORDER BY student_email, evaluator_role, evaluator_email
  `).all();
}

export function createNotificationBatch({ title, message, target_type, target_value, created_by }) {
  const now = Date.now();
  const info = db.prepare(`
    INSERT INTO notification_batches (title, message, target_type, target_value, created_at, created_by)
    VALUES (@title, @message, @target_type, @target_value, @created_at, @created_by)
  `).run({
    title: title || null,
    message,
    target_type,
    target_value,
    created_at: now,
    created_by: created_by || null
  });
  return info.lastInsertRowid;
}

export function addNotificationDeliveries({ batch_id, recipient_emails }) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO notification_deliveries (batch_id, recipient_email, read_at)
    VALUES (@batch_id, @recipient_email, NULL)
  `);
  const tx = db.transaction(({ batch_id, recipient_emails }) => {
    let n = 0;
    for (const email of recipient_emails || []) {
      if (!email) continue;
      stmt.run({ batch_id, recipient_email: String(email).toLowerCase() });
      n += 1;
    }
    return n;
  });
  return tx({ batch_id, recipient_emails });
}

export function listNotificationBatches({ limit = 30 } = {}) {
  const lim = Math.max(1, Math.min(200, Number(limit) || 30));
  return db.prepare(`
    SELECT
      b.id,
      b.title,
      b.message,
      b.target_type,
      b.target_value,
      b.created_at,
      b.created_by,
      COUNT(d.id) AS recipients,
      SUM(CASE WHEN d.read_at IS NOT NULL THEN 1 ELSE 0 END) AS read_count
    FROM notification_batches b
    LEFT JOIN notification_deliveries d ON d.batch_id = b.id
    GROUP BY b.id
    ORDER BY b.created_at DESC, b.id DESC
    LIMIT @limit
  `).all({ limit: lim });
}

export function listNotificationBatchesByCreator({ created_by, limit = 30 } = {}) {
  const lim = Math.max(1, Math.min(200, Number(limit) || 30));
  const creator = String(created_by || '').toLowerCase().trim();
  if (!creator) return [];
  return db.prepare(`
    SELECT
      b.id,
      b.title,
      b.message,
      b.target_type,
      b.target_value,
      b.created_at,
      b.created_by,
      COUNT(d.id) AS recipients,
      SUM(CASE WHEN d.read_at IS NOT NULL THEN 1 ELSE 0 END) AS read_count
    FROM notification_batches b
    LEFT JOIN notification_deliveries d ON d.batch_id = b.id
    WHERE LOWER(COALESCE(b.created_by, '')) = @created_by
    GROUP BY b.id
    ORDER BY b.created_at DESC, b.id DESC
    LIMIT @limit
  `).all({ created_by: creator, limit: lim });
}

export function listNotificationsForRecipient({ recipient_email, limit = 30 } = {}) {
  const lim = Math.max(1, Math.min(200, Number(limit) || 30));
  const email = String(recipient_email || '').toLowerCase();
  return db.prepare(`
    SELECT
      d.id AS delivery_id,
      b.id AS batch_id,
      b.title,
      b.message,
      b.created_at,
      b.created_by,
      d.read_at
    FROM notification_deliveries d
    JOIN notification_batches b ON b.id = d.batch_id
    WHERE d.recipient_email = @email
    ORDER BY b.created_at DESC, d.id DESC
    LIMIT @limit
  `).all({ email, limit: lim });
}

export function markAllNotificationsRead(recipient_email) {
  const now = Date.now();
  const email = String(recipient_email || '').toLowerCase();
  const info = db.prepare(`
    UPDATE notification_deliveries
    SET read_at = @now
    WHERE recipient_email = @email AND read_at IS NULL
  `).run({ now, email });
  return info.changes;
}

export function getStats() {
  const totalStudents = db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role='student'`).get().n;
  const totalTeachers = db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role='professor'`).get().n;
  const rooms = db.prepare(`SELECT COUNT(*) AS n FROM rooms`).get().n;

  const submittedReports = db.prepare(`
    SELECT COUNT(*) AS n
    FROM reports r
    JOIN users u ON u.email = r.user_email AND u.role = 'student'
    WHERE r.status = 'submitted'
  `).get().n;
  const pendingReports = Math.max(0, Number(totalStudents) - Number(submittedReports));

  const scheduledDefenses = db.prepare(`
    SELECT COUNT(*) AS n
    FROM defenses d
    JOIN users u ON u.email = d.user_email AND u.role = 'student'
    WHERE d.date IS NOT NULL AND d.time IS NOT NULL
  `).get().n;

  const planning = getPlanningStatus();

  const juryRows = db.prepare(`
    SELECT s.teacher_email, d.date AS day, d.time
    FROM supervisions s
    JOIN defenses d ON d.user_email = s.student_email
    JOIN users u ON u.email = s.teacher_email AND u.role = 'professor'
    WHERE s.role = 'jury' AND d.date IS NOT NULL AND d.time IS NOT NULL
    ORDER BY s.teacher_email, d.date, d.time
  `).all();

  const conflicts = new Set();
  const byTeacherDay = new Map();
  for (const r of juryRows) {
    const t = String(r.teacher_email || '').toLowerCase();
    const day = String(r.day || '');
    const range = parseTimeRange(r.time);
    if (!t || !day || !range) continue;
    const key = `${t}@@${day}`;
    const arr = byTeacherDay.get(key) || [];
    arr.push({ ...range });
    byTeacherDay.set(key, arr);
  }

  for (const [key, intervals] of byTeacherDay.entries()) {
    intervals.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
    let prevEnd = null;
    for (const iv of intervals) {
      if (prevEnd !== null && iv.startMin < prevEnd) {
        const teacher_email = key.split('@@')[0];
        conflicts.add(teacher_email);
        break;
      }
      prevEnd = iv.endMin;
    }
  }

  const gradeRows = db.prepare(`
    SELECT e.student_email, AVG(e.grade) AS avg_grade
    FROM evaluations e
    JOIN users u ON u.email = e.student_email AND u.role = 'student'
    WHERE e.grade IS NOT NULL
    GROUP BY e.student_email
  `).all();

  const gradeDistribution = { tresBien: 0, bien: 0, assezBien: 0, passable: 0, insuffisant: 0 };
  for (const r of gradeRows) {
    const g = Number(r.avg_grade);
    if (!Number.isFinite(g)) continue;
    const k = gradeBucketKey(g);
    gradeDistribution[k] += 1;
  }
  const gradedStudents = gradeRows.length;
  const ungradedStudents = Math.max(0, Number(totalStudents) - gradedStudents);

  return {
    totalStudents,
    totalTeachers,
    rooms,
    pendingReports,
    submittedReports,
    scheduledDefenses,
    planningValidated: !!planning.validated,
    planningValidatedAt: planning.validated_at || null,
    planningValidatedBy: planning.validated_by || null,
    unavailableJuries: conflicts.size,
    unavailableJuryEmails: Array.from(conflicts).slice(0, 20),
    gradeDistribution,
    gradedStudents,
    ungradedStudents
  };
}

export function deleteUserAccount(email) {
  const tx = db.transaction((email) => {
    // Clean up records that don't have foreign keys.
    db.prepare(`UPDATE room_slots SET reserved_by = NULL WHERE reserved_by = ?`).run(email);
    db.prepare(`DELETE FROM supervisions WHERE student_email = ? OR teacher_email = ?`).run(email, email);
    db.prepare(`DELETE FROM messages WHERE user = ? OR peer = ?`).run(email, email);
    db.prepare(`DELETE FROM notification_deliveries WHERE recipient_email = ?`).run(email);
    db.prepare(`DELETE FROM defenses WHERE user_email = ?`).run(email);
    db.prepare(`DELETE FROM reports WHERE user_email = ?`).run(email);

    // These two will also cascade from users via FK, but keep them explicit for safety.
    db.prepare(`DELETE FROM student_details WHERE user_email = ?`).run(email);
    db.prepare(`DELETE FROM teacher_details WHERE user_email = ?`).run(email);

    db.prepare(`DELETE FROM users WHERE email = ?`).run(email);
  });
  tx(email);
  return true;
}

export function deleteRoomById(room_id) {
  const tx = db.transaction((room_id) => {
    const room = db.prepare(`SELECT name FROM rooms WHERE id = ?`).get(room_id);
    if (!room) return 0;
    db.prepare(`DELETE FROM room_slots WHERE room_name = ?`).run(room.name);
    db.prepare(`DELETE FROM defenses WHERE classroom = ?`).run(room.name);
    return db.prepare(`DELETE FROM rooms WHERE id = ?`).run(room_id).changes;
  });
  return tx(room_id);
}

export function deleteRoomSlotById(slot_id) {
  const tx = db.transaction((slot_id) => {
    const slot = db.prepare(`SELECT room_name, day, start, end, reserved_by FROM room_slots WHERE id = ?`).get(slot_id);
    if (!slot) return 0;

    if (slot.reserved_by) {
      const time = `${slot.start}-${slot.end}`;
      db.prepare(`DELETE FROM defenses WHERE user_email = ? AND date = ? AND classroom = ? AND time = ?`).run(
        slot.reserved_by,
        slot.day,
        slot.room_name,
        time
      );
    }

    return db.prepare(`DELETE FROM room_slots WHERE id = ?`).run(slot_id).changes;
  });
  return tx(slot_id);
}

export function deleteScheduleForStudent(student_email) {
  const tx = db.transaction((student_email) => {
    db.prepare(`UPDATE room_slots SET reserved_by = NULL WHERE reserved_by = ?`).run(student_email);
    return db.prepare(`DELETE FROM defenses WHERE user_email = ?`).run(student_email).changes;
  });
  return tx(student_email);
}
