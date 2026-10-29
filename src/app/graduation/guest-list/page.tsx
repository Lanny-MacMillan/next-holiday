'use client';

import GuestListPage from '@/components/templates/GuestListPage';
import { guestListConfigs } from '@/config/guestListConfigs';

export default function GraduationGuestListPage() {
  return <GuestListPage config={guestListConfigs.graduation} />;
}
