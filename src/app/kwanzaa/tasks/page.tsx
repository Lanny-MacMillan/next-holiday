'use client';

import TasksPage from '@/components/templates/TasksPage';
import { taskPageConfigs } from '@/config/taskPageConfigs';

export default function KwanzaaTasksPage() {
  return <TasksPage config={taskPageConfigs.kwanzaa} />;
}
