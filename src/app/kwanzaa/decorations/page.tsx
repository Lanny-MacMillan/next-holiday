'use client';

import TasksPage from '@/components/templates/TasksPage';
import { decorationPageConfigs } from '@/config/decorationPageConfigs';

export default function KwanzaaDecorationsPage() {
  return <TasksPage config={decorationPageConfigs.kwanzaa} />;
}
