'use client';

import TasksPage from '@/components/templates/TasksPage';
import { eventPageConfigs } from '@/config/eventPageConfigs';

export default function FathersDayEventsPage() {
  return <TasksPage config={eventPageConfigs['fathers-day']} />;
}
