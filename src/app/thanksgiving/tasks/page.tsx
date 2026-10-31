'use client';

import TasksPage from '@/components/templates/TasksPage';
import { taskPageConfigs } from '@/config/taskPageConfigs';

export default function ThanksgivingTasksPage() {
  return <TasksPage config={taskPageConfigs.thanksgiving} />;
}
