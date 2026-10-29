'use client';

import CardsPage from '@/components/templates/CardsPage';
import { cardPageConfigs } from '@/config/cardPageConfigs';

export default function FathersDayCardsPage() {
  return <CardsPage config={cardPageConfigs['fathers-day']} />;
}
