'use client';

import TasksPage from '@/components/templates/TasksPage';
import { checklistPageConfigs } from '@/config/checklistPageConfigs';

export default function ValentinesReservationsPage() {
  return <TasksPage config={checklistPageConfigs['reservations']} />;
}
