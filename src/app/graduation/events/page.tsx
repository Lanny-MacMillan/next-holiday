'use client';

import TasksPage from '@/components/templates/TasksPage';
import { eventPageConfigs } from '@/config/eventPageConfigs';

export default function GraduationEventsPage() {
  return <TasksPage config={eventPageConfigs.graduation} />;
}
