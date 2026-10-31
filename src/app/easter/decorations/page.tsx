'use client';

import TasksPage from '@/components/templates/TasksPage';
import { decorationPageConfigs } from '@/config/decorationPageConfigs';

export default function EasterDecorationsPage() {
  return <TasksPage config={decorationPageConfigs.easter} />;
}
