'use client';

import TasksPage from '@/components/templates/TasksPage';
import { eventPageConfigs } from '@/config/eventPageConfigs';

export default function FourthOfJulyEventsPage() {
  return <TasksPage config={eventPageConfigs['fourth-of-july']} />;
}
