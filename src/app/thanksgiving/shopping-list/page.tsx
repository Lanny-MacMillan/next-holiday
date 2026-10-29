'use client';

import GiftListPage from '@/components/templates/GiftListPage';
import { giftListConfigs } from '@/config/giftListConfigs';

export default function ThanksgivingShoppingListPage() {
  return <GiftListPage config={giftListConfigs.thanksgiving} />;
}
