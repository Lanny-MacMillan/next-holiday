'use client';

import GiftListPage from '@/components/templates/GiftListPage';
import { giftListConfigs } from '@/config/giftListConfigs';

export default function MothersDayGiftListPage() {
  return <GiftListPage config={giftListConfigs['mothers-day']} />;
}
