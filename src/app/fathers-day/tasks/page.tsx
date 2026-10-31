'use client';

import TasksPage from '@/components/templates/TasksPage';
import { taskPageConfigs } from '@/config/taskPageConfigs';

export default function FathersDayTasksPage() {
  return <TasksPage config={taskPageConfigs['fathers-day']} />;
}
