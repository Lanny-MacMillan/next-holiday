'use client';

import TasksPage from '@/components/templates/TasksPage';
import { taskPageConfigs } from '@/config/taskPageConfigs';

export default function HalloweenTasksPage() {
  return <TasksPage config={taskPageConfigs.halloween} />;
}
