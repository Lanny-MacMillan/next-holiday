'use client';

import GiftListPage from '@/components/templates/GiftListPage';
import { giftListConfigs } from '@/config/giftListConfigs';

export default function HalloweenGiftListPage() {
  return <GiftListPage config={giftListConfigs.halloween} />;
}
