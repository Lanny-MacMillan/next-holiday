'use client';

import TasksPage from '@/components/templates/TasksPage';
import { taskPageConfigs } from '@/config/taskPageConfigs';

export default function AnniversaryTasksPage() {
  return <TasksPage config={taskPageConfigs.anniversary} />;
}
