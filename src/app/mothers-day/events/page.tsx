'use client';

import TasksPage from '@/components/templates/TasksPage';
import { eventPageConfigs } from '@/config/eventPageConfigs';

export default function MothersDayEventsPage() {
  return <TasksPage config={eventPageConfigs['mothers-day']} />;
}
