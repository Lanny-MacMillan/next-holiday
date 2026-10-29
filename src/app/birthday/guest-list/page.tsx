'use client';

import GuestListPage from '@/components/templates/GuestListPage';
import { guestListConfigs } from '@/config/guestListConfigs';

export default function BirthdayGuestListPage() {
  return <GuestListPage config={guestListConfigs.birthday} />;
}
