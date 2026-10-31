'use client';

import TasksPage from '@/components/templates/TasksPage';
import { eventPageConfigs } from '@/config/eventPageConfigs';

export default function NewYearEventsPage() {
  return <TasksPage config={eventPageConfigs['new-year']} />;
}
