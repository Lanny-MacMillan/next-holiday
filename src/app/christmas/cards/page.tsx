'use client';

import CardsPage from '@/components/templates/CardsPage';
import { cardPageConfigs } from '@/config/cardPageConfigs';

export default function ChristmasCardsPage() {
  return <CardsPage config={cardPageConfigs.christmas} />;
}
