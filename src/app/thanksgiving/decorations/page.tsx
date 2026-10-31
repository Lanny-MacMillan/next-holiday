'use client';

import TasksPage from '@/components/templates/TasksPage';
import { decorationPageConfigs } from '@/config/decorationPageConfigs';

export default function ThanksgivingDecorationsPage() {
  return <TasksPage config={decorationPageConfigs.thanksgiving} />;
}
