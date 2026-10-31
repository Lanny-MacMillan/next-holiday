'use client';

import TasksPage from '@/components/templates/TasksPage';
import { checklistPageConfigs } from '@/config/checklistPageConfigs';

export default function BabyShowerGamesPage() {
  return <TasksPage config={checklistPageConfigs['games']} />;
}
