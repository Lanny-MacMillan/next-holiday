'use client';

import GiftListPage from '@/components/templates/GiftListPage';
import { giftListConfigs } from '@/config/giftListConfigs';

export default function BirthdayGiftListPage() {
  return <GiftListPage config={giftListConfigs.birthday} />;
}
