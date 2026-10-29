'use client';

import CardsPage from '@/components/templates/CardsPage';
import { cardPageConfigs } from '@/config/cardPageConfigs';

export default function MothersDayCardsPage() {
  return <CardsPage config={cardPageConfigs['mothers-day']} />;
}
