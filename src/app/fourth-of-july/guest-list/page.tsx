'use client';

import GuestListPage from '@/components/templates/GuestListPage';
import { guestListConfigs } from '@/config/guestListConfigs';

export default function FourthOfJulyGuestListPage() {
  return <GuestListPage config={guestListConfigs['fourth-of-july']} />;
}
