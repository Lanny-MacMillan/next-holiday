'use client';

import GiftListPage from '@/components/templates/GiftListPage';
import { giftListConfigs } from '@/config/giftListConfigs';

export default function AnniversaryGiftListPage() {
  return <GiftListPage config={giftListConfigs.anniversary} />;
}
