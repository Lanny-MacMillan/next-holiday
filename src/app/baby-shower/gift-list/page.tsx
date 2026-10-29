'use client';

import GiftListPage from '@/components/templates/GiftListPage';
import { giftListConfigs } from '@/config/giftListConfigs';

export default function BabyShowerGiftListPage() {
  return <GiftListPage config={giftListConfigs['baby-shower']} />;
}
