'use client';

import TasksPage from '@/components/templates/TasksPage';
import { checklistPageConfigs } from '@/config/checklistPageConfigs';

export default function AnniversaryDateIdeasPage() {
  return <TasksPage config={checklistPageConfigs['date-ideas']} />;
}
