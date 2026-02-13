import React from 'react';
import NotificationsPanel from '../../components/NotificationsPanel.jsx';

export default function ProfessorNotifications({ teacherEmail }) {
  return <NotificationsPanel email={teacherEmail} />;
}

