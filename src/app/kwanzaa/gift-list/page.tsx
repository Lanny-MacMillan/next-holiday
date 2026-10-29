'use client';

import GiftListPage from '@/components/templates/GiftListPage';
import { giftListConfigs } from '@/config/giftListConfigs';

export default function KwanzaaGiftListPage() {
  return <GiftListPage config={giftListConfigs.kwanzaa} />;
}
