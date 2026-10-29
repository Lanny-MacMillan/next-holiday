'use client';

import TasksPage from '@/components/templates/TasksPage';
import { taskPageConfigs } from '@/config/taskPageConfigs';

export default function FourthOfJulyTasksPage() {
  return <TasksPage config={taskPageConfigs['fourth-of-july']} />;
}
