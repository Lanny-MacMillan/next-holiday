'use client';

import CardsPage from '@/components/templates/CardsPage';
import { cardPageConfigs } from '@/config/cardPageConfigs';

export default function ValentinesCardsPage() {
  return <CardsPage config={cardPageConfigs.valentines} />;
}
