'use client';

import GiftListPage from '@/components/templates/GiftListPage';
import { giftListConfigs } from '@/config/giftListConfigs';

export default function FathersDayGiftListPage() {
  return <GiftListPage config={giftListConfigs['fathers-day']} />;
}
