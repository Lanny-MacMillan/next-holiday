'use client';

import TasksPage from '@/components/templates/TasksPage';
import { checklistPageConfigs } from '@/config/checklistPageConfigs';

export default function NewYearResolutionTrackerPage() {
  return <TasksPage config={checklistPageConfigs['resolution-tracker']} />;
}
