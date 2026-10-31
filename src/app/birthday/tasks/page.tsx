'use client';

import TasksPage from '@/components/templates/TasksPage';
import { taskPageConfigs } from '@/config/taskPageConfigs';

export default function BirthdayTasksPage() {
  return <TasksPage config={taskPageConfigs.birthday} />;
}
