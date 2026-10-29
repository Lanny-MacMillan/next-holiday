'use client';

import GuestListPage from '@/components/templates/GuestListPage';
import { guestListConfigs } from '@/config/guestListConfigs';

export default function BabyShowerGuestListPage() {
  return <GuestListPage config={guestListConfigs['baby-shower']} />;
}
