'use client';

import TasksPage from '@/components/templates/TasksPage';
import { eventPageConfigs } from '@/config/eventPageConfigs';

export default function KwanzaaEventsPage() {
  return <TasksPage config={eventPageConfigs.kwanzaa} />;
}
