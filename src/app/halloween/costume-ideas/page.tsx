'use client';

import TasksPage from '@/components/templates/TasksPage';
import { checklistPageConfigs } from '@/config/checklistPageConfigs';

export default function HalloweenCostumeIdeasPage() {
  return <TasksPage config={checklistPageConfigs['costume-ideas']} />;
}
