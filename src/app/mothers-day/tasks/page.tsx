'use client';

import TasksPage from '@/components/templates/TasksPage';
import { taskPageConfigs } from '@/config/taskPageConfigs';

export default function MothersDayTasksPage() {
  return <TasksPage config={taskPageConfigs['mothers-day']} />;
}
