'use client';

import TasksPage from '@/components/templates/TasksPage';
import { taskPageConfigs } from '@/config/taskPageConfigs';

export default function BabyShowerTasksPage() {
  return <TasksPage config={taskPageConfigs['baby-shower']} />;
}
