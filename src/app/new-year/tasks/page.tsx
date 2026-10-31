'use client';

import TasksPage from '@/components/templates/TasksPage';
import { taskPageConfigs } from '@/config/taskPageConfigs';

export default function NewYearTasksPage() {
  return <TasksPage config={taskPageConfigs['new-year']} />;
}
