'use client';

import GiftListPage from '@/components/templates/GiftListPage';
import { giftListConfigs } from '@/config/giftListConfigs';

export default function ChristmasGiftListPage() {
  return <GiftListPage config={giftListConfigs.christmas} />;
}
