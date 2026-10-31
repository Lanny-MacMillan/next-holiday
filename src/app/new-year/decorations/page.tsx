'use client';

import TasksPage from '@/components/templates/TasksPage';
import { decorationPageConfigs } from '@/config/decorationPageConfigs';

export default function NewYearDecorationsPage() {
  return <TasksPage config={decorationPageConfigs['new-year']} />;
}
