'use client';

import TasksPage from '@/components/templates/TasksPage';
import { eventPageConfigs } from '@/config/eventPageConfigs';

export default function EasterEventsPage() {
  return <TasksPage config={eventPageConfigs.easter} />;
}
