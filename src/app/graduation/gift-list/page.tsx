'use client';

import GiftListPage from '@/components/templates/GiftListPage';
import { giftListConfigs } from '@/config/giftListConfigs';

export default function GraduationGiftListPage() {
  return <GiftListPage config={giftListConfigs.graduation} />;
}
