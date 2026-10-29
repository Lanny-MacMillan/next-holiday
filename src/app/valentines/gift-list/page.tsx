'use client';

import GiftListPage from '@/components/templates/GiftListPage';
import { giftListConfigs } from '@/config/giftListConfigs';

export default function ValentinesGiftListPage() {
  return <GiftListPage config={giftListConfigs.valentines} />;
}
