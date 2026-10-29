'use client';

import TasksPage from '@/components/templates/TasksPage';
import { taskPageConfigs } from '@/config/taskPageConfigs';

export default function EasterTasksPage() {
  return <TasksPage config={taskPageConfigs.easter} />;
}
