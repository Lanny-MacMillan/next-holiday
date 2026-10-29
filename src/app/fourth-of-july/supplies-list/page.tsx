'use client';

import GiftListPage from '@/components/templates/GiftListPage';
import { giftListConfigs } from '@/config/giftListConfigs';

export default function FourthOfJulySuppliesListPage() {
  return <GiftListPage config={giftListConfigs['fourth-of-july-supplies']} />;
}
