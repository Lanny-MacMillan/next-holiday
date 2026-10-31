'use client';

import TasksPage from '@/components/templates/TasksPage';
import { decorationPageConfigs } from '@/config/decorationPageConfigs';

export default function FourthOfJulyDecorationsPage() {
  return <TasksPage config={decorationPageConfigs['fourth-of-july']} />;
}
