'use client';

import GiftListPage from '@/components/templates/GiftListPage';
import { giftListConfigs } from '@/config/giftListConfigs';

export default function EasterBasketListPage() {
  return <GiftListPage config={giftListConfigs.easter} />;
}
