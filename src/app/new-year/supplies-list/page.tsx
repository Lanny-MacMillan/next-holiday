'use client';

import GiftListPage from '@/components/templates/GiftListPage';
import { giftListConfigs } from '@/config/giftListConfigs';

export default function NewYearSuppliesListPage() {
  return <GiftListPage config={giftListConfigs['new-year-supplies']} />;
}
