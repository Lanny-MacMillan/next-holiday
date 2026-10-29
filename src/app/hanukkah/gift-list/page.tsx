'use client';

import GiftListPage from '@/components/templates/GiftListPage';
import { giftListConfigs } from '@/config/giftListConfigs';

export default function HanukkahGiftListPage() {
  return <GiftListPage config={giftListConfigs.hanukkah} />;
}
