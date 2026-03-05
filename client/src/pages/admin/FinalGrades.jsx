import React, { useEffect, useMemo, useState } from 'react';
import { listFinalGrades, publishFinalGrade, saveAdminEvaluation } from '../../lib/adminApi.js';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

function fmtDate(ts) {
  if (!ts) return '-';
  try {
    return new Date(Number(ts)).toLocaleString();
  } catch {
    return '-';
  }
}

export default function AdminFinalGrades({ adminEmail }) {
  const { isFrench } = useLanguage();
  const copy = isFrench
    ? {
        title: 'Notes finales',
        subtitle: 'Saisie des notes et publication officielle des resultats.',
        noteEntryTitle: 'Saisir une note',
        noteEntryHint: 'Cette note est ajoutee aux evaluations et compte dans la moyenne finale.',
        student: 'Etudiant',
        role: 'Role evaluateur',
        roleJury: 'Jury',
        roleSupervisor: 'Encadrant',
        grade: 'Note (/20)',
        comment: 'Commentaire',
        commentPlaceholder: 'Commentaire optionnel...',
        saveNote: 'Enregistrer la note',
        savingNote: 'Enregistrement...',
        refresh: 'Actualiser',
        loadError: 'Impossible de charger les notes finales.',
        saveError: "Impossible d'enregistrer la note.",
        publishError: 'Impossible de mettre a jour la publication.',
        invalidStudent: 'Veuillez selectionner un etudiant.',
        invalidGrade: 'Veuillez saisir une note valide entre 0 et 20.',
        saved: 'Note enregistree.',
        publishAll: 'Publier toutes les notes calculees',
        publishingAll: 'Publication...',
        tableTitle: 'Publication des notes finales',
        tableSubtitle: 'Publier ou retirer la publication par etudiant.',
        tableCols: ['Etudiant', 'Email', 'Moyenne', 'Mention', 'Evaluations', 'Publication', 'Action'],
        published: 'Publiee',
        notPublished: 'Non publiee',
        publish: 'Publier',
        unpublish: 'Retirer',
        saving: 'Sauvegarde...',
        noData: 'Aucune donnee de note finale.'
      }
    : {
        title: 'Final Grades',
        subtitle: 'Enter grades and publish official final results.',
        noteEntryTitle: 'Enter grade',
        noteEntryHint: 'This grade is added to evaluations and contributes to final average.',
        student: 'Student',
        role: 'Evaluator role',
        roleJury: 'Jury',
        roleSupervisor: 'Supervisor',
        grade: 'Grade (/20)',
        comment: 'Comment',
        commentPlaceholder: 'Optional comment...',
        saveNote: 'Save grade',
        savingNote: 'Saving...',
        refresh: 'Refresh',
        loadError: 'Unable to load final grades.',
        saveError: 'Unable to save grade.',
        publishError: 'Unable to update publication.',
        invalidStudent: 'Please select a student.',
        invalidGrade: 'Please enter a valid grade between 0 and 20.',
        saved: 'Grade saved.',
        publishAll: 'Publish all computed grades',
        publishingAll: 'Publishing...',
        tableTitle: 'Final grade publication',
        tableSubtitle: 'Publish or unpublish per student.',
        tableCols: ['Student', 'Email', 'Average', 'Mention', 'Evaluations', 'Publication', 'Action'],
        published: 'Published',
        notPublished: 'Not published',
        publish: 'Publish',
        unpublish: 'Unpublish',
        saving: 'Saving...',
        noData: 'No final-grade data.'
      };

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishingTarget, setPublishingTarget] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [form, setForm] = useState({
    student_email: '',
    evaluator_role: 'jury',
    grade: '',
    comment: ''
  });

  async function load() {
    setLoading(true);
    const r = await listFinalGrades();
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || copy.loadError);
      setRows([]);
      setLoading(false);
      return;
    }
    setError('');
    const nextRows = Array.isArray(r.data) ? r.data : [];
    setRows(nextRows);
    if (!String(form.student_email || '').trim() && nextRows.length) {
      setForm((prev) => ({ ...prev, student_email: String(nextRows[0].student_email || '') }));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [isFrench]);

  async function onPublish(student_email, published) {
    setPublishingTarget(student_email || '');
    const r = await publishFinalGrade({
      student_email,
      published,
      published_by: String(adminEmail || '').trim().toLowerCase()
    });
    setPublishingTarget('');

    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || copy.publishError);
      return;
    }
    setError('');
    await load();
  }

  async function onPublishAllGraded() {
    setPublishingTarget('all');
    const r = await publishFinalGrade({
      student_email: 'all',
      published: true,
      published_by: String(adminEmail || '').trim().toLowerCase()
    });
    setPublishingTarget('');
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || copy.publishError);
      return;
    }
    setError('');
    await load();
  }

  async function onSaveNote() {
    const student_email = String(form.student_email || '').trim().toLowerCase();
    const evaluator_role = String(form.evaluator_role || 'jury').trim().toLowerCase();
    const grade = Number(form.grade);
    const comment = String(form.comment || '').trim();
    const evaluator_email = String(adminEmail || '').trim().toLowerCase() || 'system@planify.local';

    if (!student_email) {
      setError(copy.invalidStudent);
      return;
    }
    if (!Number.isFinite(grade) || grade < 0 || grade > 20) {
      setError(copy.invalidGrade);
      return;
    }

    setSavingNote(true);
    const r = await saveAdminEvaluation({
      student_email,
      evaluator_email,
      evaluator_role,
      grade,
      comment
    });
    setSavingNote(false);

    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || copy.saveError);
      return;
    }

    setError('');
    setForm((prev) => ({ ...prev, grade: '', comment: '' }));
    await load();
    alert(copy.saved);
  }

  const studentOptions = useMemo(
    () =>
      rows.map((row) => ({
        value: String(row.student_email || ''),
        label: String(row.student_name || row.student_email || '')
      })),
    [rows]
  );

  return (
    <div>
      <h2 className="title">{copy.title}</h2>
      <p className="subtitle">{copy.subtitle}</p>

      <div style={{ marginTop: 14, border: '1px solid var(--line)', borderRadius: 14, padding: 12, background: 'var(--surface-soft)' }}>
        <p className="subtitle" style={{ textAlign: 'left', margin: 0 }}>
          {copy.noteEntryTitle}
        </p>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 13 }}>{copy.noteEntryHint}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr .7fr', gap: 10, marginTop: 10 }}>
          <div className="field select" style={{ margin: 0 }}>
            <span className="icon" aria-hidden="true">
              S
            </span>
            <select value={form.student_email} onChange={(e) => setForm((prev) => ({ ...prev, student_email: e.target.value }))}>
              {studentOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="chevron" aria-hidden="true">
              v
            </span>
          </div>

          <div className="field select" style={{ margin: 0 }}>
            <span className="icon" aria-hidden="true">
              R
            </span>
            <select value={form.evaluator_role} onChange={(e) => setForm((prev) => ({ ...prev, evaluator_role: e.target.value }))}>
              <option value="jury">{copy.roleJury}</option>
              <option value="supervisor">{copy.roleSupervisor}</option>
            </select>
            <span className="chevron" aria-hidden="true">
              v
            </span>
          </div>

          <div className="field" style={{ margin: 0 }}>
            <span className="icon" aria-hidden="true">
              N
            </span>
            <input
              type="number"
              min="0"
              max="20"
              step="0.25"
              placeholder={copy.grade}
              value={form.grade}
              onChange={(e) => setForm((prev) => ({ ...prev, grade: e.target.value }))}
            />
          </div>
        </div>

        <div className="field" style={{ margin: '10px 0 0' }}>
          <span className="icon" aria-hidden="true">
            C
          </span>
          <input
            placeholder={copy.commentPlaceholder}
            value={form.comment}
            onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
          />
        </div>

        <div className="toolbar" style={{ marginTop: 12 }}>
          <button className="primary" type="button" onClick={onSaveNote} disabled={savingNote || !rows.length}>
            {savingNote ? copy.savingNote : copy.saveNote}
          </button>
          <button className="btn" type="button" onClick={load} disabled={loading}>
            {loading ? copy.saving : copy.refresh}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3 className="title" style={{ fontSize: 18, textAlign: 'left' }}>
          {copy.tableTitle}
        </h3>
        <p className="subtitle" style={{ textAlign: 'left' }}>
          {copy.tableSubtitle}
        </p>

        <div className="toolbar" style={{ marginTop: 10 }}>
          <button className="primary" type="button" onClick={onPublishAllGraded} disabled={publishingTarget === 'all' || loading}>
            {publishingTarget === 'all' ? copy.publishingAll : copy.publishAll}
          </button>
          <button className="btn" type="button" onClick={load} disabled={loading}>
            {loading ? copy.saving : copy.refresh}
          </button>
        </div>
      </div>

      {error && <div className="errors">{error}</div>}

      <div style={{ marginTop: 12, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>{copy.tableCols[0]}</th>
              <th>{copy.tableCols[1]}</th>
              <th>{copy.tableCols[2]}</th>
              <th>{copy.tableCols[3]}</th>
              <th>{copy.tableCols[4]}</th>
              <th>{copy.tableCols[5]}</th>
              <th style={{ width: 140 }}>{copy.tableCols[6]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.student_email || index}>
                <td>{row.student_name}</td>
                <td>{row.student_email}</td>
                <td>{row.avg_grade === null || row.avg_grade === undefined ? '-' : Number(row.avg_grade).toFixed(2)}</td>
                <td>{row.mention || '-'}</td>
                <td>{row.grades_count || 0}</td>
                <td>
                  {row.published ? (
                    <>
                      {copy.published}
                      <br />
                      <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                        {fmtDate(row.published_at)}
                        {row.published_by ? ` - ${row.published_by}` : ''}
                      </span>
                    </>
                  ) : (
                    copy.notPublished
                  )}
                </td>
                <td>
                  <button
                    className={row.published ? 'btn' : 'primary'}
                    type="button"
                    disabled={
                      publishingTarget === row.student_email ||
                      (!row.published && (row.avg_grade === null || row.avg_grade === undefined))
                    }
                    onClick={() => onPublish(row.student_email, !row.published)}
                  >
                    {publishingTarget === row.student_email ? copy.saving : row.published ? copy.unpublish : copy.publish}
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr>
                <td colSpan={7} style={{ padding: 14, color: 'var(--muted)' }}>
                  {copy.noData}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
