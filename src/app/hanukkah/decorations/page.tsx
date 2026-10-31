'use client';

import TasksPage from '@/components/templates/TasksPage';
import { decorationPageConfigs } from '@/config/decorationPageConfigs';

export default function HanukkahDecorationsPage() {
  return <TasksPage config={decorationPageConfigs.hanukkah} />;
}
