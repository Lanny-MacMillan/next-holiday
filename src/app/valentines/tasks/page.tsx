'use client';

import TasksPage from '@/components/templates/TasksPage';
import { taskPageConfigs } from '@/config/taskPageConfigs';

export default function ValentinesTasksPage() {
  return <TasksPage config={taskPageConfigs.valentines} />;
}
