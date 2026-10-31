'use client';

import TasksPage from '@/components/templates/TasksPage';
import { decorationPageConfigs } from '@/config/decorationPageConfigs';

export default function HalloweenDecorationsPage() {
  return <TasksPage config={decorationPageConfigs.halloween} />;
}
