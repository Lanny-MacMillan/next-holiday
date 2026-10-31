'use client';

import TasksPage from '@/components/templates/TasksPage';
import { eventPageConfigs } from '@/config/eventPageConfigs';

export default function HanukkahEventsPage() {
  return <TasksPage config={eventPageConfigs.hanukkah} />;
}
