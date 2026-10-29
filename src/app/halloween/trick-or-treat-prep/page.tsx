'use client';

import TasksPage from '@/components/templates/TasksPage';
import { checklistPageConfigs } from '@/config/checklistPageConfigs';

export default function HalloweenTrickOrTreatPrepPage() {
  return <TasksPage config={checklistPageConfigs['trick-or-treat-prep']} />;
}
