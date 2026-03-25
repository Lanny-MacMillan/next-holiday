// Example usage of the new form builder system
// This demonstrates how to use buildFormConfig with FormModal

import React, { useMemo } from 'react';
import FormModal from '@/components/modals/FormModal';
import { buildFormConfig, ShareMember } from '@/lib/formBuilder';
import { HolidayKey } from '@/config/baseFormConfigs';

interface ExampleFormUsageProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  holidayKey: HolidayKey;
  shareMembers: ShareMember[];
}

export default function ExampleFormUsage({
  isOpen,
  onClose,
  onSubmit,
  holidayKey,
  shareMembers,
}: ExampleFormUsageProps) {
  // Build form configuration dynamically
  const giftFormConfig = useMemo(
    () =>
      buildFormConfig('gift', holidayKey, shareMembers, {
        submitText: 'Add Gift',
        // Holiday-specific customizations can be added here
        submitButtonColor: '#10b981', // Custom color
      }),
    [holidayKey, shareMembers],
  );

  const taskFormConfig = useMemo(
    () =>
      buildFormConfig('task', holidayKey, shareMembers, {
        submitText: 'Add Task',
      }),
    [holidayKey, shareMembers],
  );

  const cardFormConfig = useMemo(
    () =>
      buildFormConfig('card', holidayKey, shareMembers, {
        submitText: 'Send Card',
      }),
    [holidayKey, shareMembers],
  );

  return (
    <>
      {/* Gift Form Example */}
      <FormModal
        isOpen={isOpen}
        title="Add Gift"
        fields={giftFormConfig.fields}
        onSubmit={onSubmit}
        onClose={onClose}
        submitText={giftFormConfig.submitText}
        cardClassName={giftFormConfig.cardClassName}
        showAddressBook={giftFormConfig.showAddressBook}
        shareMembers={shareMembers}
      />

      {/* Task Form Example */}
      <FormModal
        isOpen={false} // Set to true when needed
        title="Add Task"
        fields={taskFormConfig.fields}
        onSubmit={onSubmit}
        onClose={onClose}
        submitText={taskFormConfig.submitText}
        cardClassName={taskFormConfig.cardClassName}
        shareMembers={shareMembers}
      />

      {/* Card Form Example */}
      <FormModal
        isOpen={false} // Set to true when needed
        title="Send Card"
        fields={cardFormConfig.fields}
        onSubmit={onSubmit}
        onClose={onClose}
        submitText={cardFormConfig.submitText}
        cardClassName={cardFormConfig.cardClassName}
        showAddressBook={cardFormConfig.showAddressBook}
        shareMembers={shareMembers}
      />
    </>
  );
}
