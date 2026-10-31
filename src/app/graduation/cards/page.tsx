'use client';

import CardsPage from '@/components/templates/CardsPage';
import { cardPageConfigs } from '@/config/cardPageConfigs';

export default function GraduationCardsPage() {
  return <CardsPage config={cardPageConfigs.graduation} />;
}
