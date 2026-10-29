'use client';

import GuestListPage from '@/components/templates/GuestListPage';
import { guestListConfigs } from '@/config/guestListConfigs';

export default function ThanksgivingGuestListPage() {
  return <GuestListPage config={guestListConfigs.thanksgiving} />;
}
