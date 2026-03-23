import { useAppSelector } from '@/store/hooks';

/**
 * Transform form values to gift API payload
 */
export function transformGiftPayload(
  values: Record<string, any>,
  contacts: any[],
  shareMembers?: any[],
) {
  const contact = contacts.find(c => c.name === values.recipient);

  // Provide detailed error messages for address book issues
  if (!contact) {
    console.error('Contact not found for recipient:', values.recipient);

    if (!contacts || contacts.length === 0) {
      throw new Error(
        'Address book is empty. Please go to Settings > Address Book and add contacts first, then return to add supplies.',
      );
    }
    throw new Error(
      `Recipient "${values.recipient}" must be selected from the address book dropdown, not typed manually. Available contacts: ${contacts.map(c => c.name).join(', ')}`,
    );
  }

  // Handle assigned_to mapping from Auth0 userId to proper UUID
  // Support both camelCase (assignedTo) and snake_case (assigned_to) from forms
  let assignedTo = values.assigned_to || values.assignedTo || null;
  console.log('Original assigned_to:', assignedTo);

  if (assignedTo && shareMembers && shareMembers.length > 0) {
    console.log('=== ASSIGNMENT MAPPING DEBUG ===');
    console.log('Looking for assignedTo:', assignedTo);
    console.log(
      'Available shareMembers:',
      shareMembers.map(m => ({ userId: m.userId, uuid: m.uuid, name: m.name })),
    );

    // Check if it's already a valid UUID format
    const isValidUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        assignedTo,
      );
    console.log('Is already valid UUID format:', isValidUUID);

    // If assigned_to contains Auth0 ID format, try to map it to the proper UUID
    if (!isValidUUID) {
      console.log('Converting Auth0 ID to UUID...');
      // Find the member with matching Auth0 user ID
      const member = shareMembers.find(m => {
        const matches = m.userId === assignedTo;
        console.log(
          `Checking member ${m.name} (${m.userId}): ${matches ? '✅ MATCH' : '❌ no match'}`,
        );
        return matches;
      });
      console.log('Found member for assignment:', member);

      if (member && member.uuid) {
        // Validate that the UUID we're about to use is actually a valid UUID
        const isValidMemberUUID =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            member.uuid,
          );
        if (isValidMemberUUID) {
          const oldAssignedTo = assignedTo;
          assignedTo = member.uuid; // Use the UUID for assignment
          console.log(
            `✅ Mapped ${member.name} from Auth0 ID (${oldAssignedTo}) to UUID (${assignedTo})`,
          );
        } else {
          console.error(
            `❌ Member ${member.name} has invalid UUID format: ${member.uuid}`,
          );
          console.log(
            'This indicates a shareMembers configuration issue where Auth0 subject IDs are being used as UUIDs',
          );
          console.log(
            'The member should have a proper database UUID, not an Auth0 subject ID',
          );
          assignedTo = null; // Set to null if UUID is invalid
        }
      } else {
        console.warn(
          '❌ Could not find UUID for assigned user, setting to null:',
          assignedTo,
        );
        assignedTo = null; // Set to null if we can't find the UUID
      }
    } else {
      console.log('✅ Assignment value is already a valid UUID:', assignedTo);
    }
  } else {
    console.log('No shareMembers available or assignedTo is empty');
    if (assignedTo) {
      console.log(
        'WARNING: assignedTo provided but no shareMembers available:',
        assignedTo,
      );
      // If no shareMembers but assignedTo is provided, validate it's a UUID
      const isValidUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          assignedTo,
        );
      if (!isValidUUID) {
        console.warn(
          'Invalid UUID format without shareMembers, clearing assignment',
        );
        assignedTo = null;
      }
    }
  }

  console.log('Final assignedTo value for gift payload:', assignedTo);

  return {
    name: values.name || values.giftName || values.description || '', // Enhanced Compatibility uses 'name'
    description: values.description || '',
    price: values.price ? parseFloat(values.price) : 0,
    store: values.store || '',
    product_link: values.product_link || '',
    notes: values.notes || '',
    contact_id: contact.id,
    assigned_to: assignedTo, // Use snake_case to match server expectations
  };
}

/**
 * Transform form values to Thanksgiving shopping item API payload
 */
export function transformThanksgivingShoppingPayload(values: Record<string, any>) {
  return {
    name: values.giftName || '',
    description: values.description || '',
    price: values.price ? parseFloat(values.price) : 0,
    store: values.store || '',
    product_link: values.product_link || '',
    notes: values.notes || '',
    contact_id: null, // No recipient needed for Thanksgiving shopping items
  };
}

/**
 * Transform form values to card API payload
 */
export function transformCardPayload(
  values: Record<string, any>,
  contacts: any[],
  shareMembers?: any[],
) {
  const contact = contacts.find(c => c.name === values.recipient);

  // Handle assigned_to mapping from Auth0 userId to proper UUID
  // Support both camelCase (assignedTo) and snake_case (assigned_to) from forms
  let assignedTo = values.assigned_to || values.assignedTo || null;

  if (assignedTo && shareMembers && shareMembers.length > 0) {
    console.log('=== CARD ASSIGNMENT MAPPING DEBUG ===');
    console.log('Looking for assignedTo:', assignedTo);
    console.log(
      'Available shareMembers:',
      shareMembers.map(m => ({ userId: m.userId, uuid: m.uuid, name: m.name })),
    );

    // If assigned_to contains Auth0 ID format, try to map it to the proper UUID
    if (
      assignedTo.includes('|') ||
      !assignedTo.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      )
    ) {
      // Find the member with matching Auth0 user ID
      const member = shareMembers.find(m => {
        const matches = m.userId === assignedTo;
        console.log(
          `Checking member ${m.name} (${m.userId}): ${matches ? '✅ MATCH' : '❌ no match'}`,
        );
        return matches;
      });
      console.log('Found member for assignment:', member);

      if (member && member.uuid) {
        const oldAssignedTo = assignedTo;
        assignedTo = member.uuid; // Use the UUID for assignment
        console.log(
          `✅ Mapped ${member.name} from Auth0 ID (${oldAssignedTo}) to UUID (${assignedTo})`,
        );
      } else {
        console.warn(
          '❌ Could not find UUID for assigned user, setting to null:',
          assignedTo,
        );
        assignedTo = null; // Set to null if we can't find the UUID
      }
    }
  } else {
    console.log('No shareMembers available or assignedTo is empty for card');
  }

  return {
    recipient: values.recipient || '',
    message: values.message || '',
    address: values.address || '',
    contact_id: contact?.id || null,
    assigned_to: assignedTo, // Use snake_case to match server expectations
  };
}

/**
 * Transform form values to task API payload
 */
export function transformTaskPayload(values: Record<string, any>, pathname: string) {
  // Determine category based on route
  const pathSegments = pathname.split('/');
  const resourceType = pathSegments[2];

  let category = null;
  switch (resourceType) {
    case 'events':
      category = 'events';
      break;
    case 'decorations':
      category = 'decorations';
      break;
    case 'candle-lighting':
      category = 'candle-lighting';
      break;
    case 'meal-planning':
      category = 'meal-planning';
      break;
    case 'decorations-checklist':
      category = 'decorations-checklist';
      break;
    case 'shopping-list':
      category = 'shopping-list';
      break;
    case 'basket-list':
      category = 'basket-list';
      break;
    case 'date-ideas':
      category = 'date-ideas';
      break;
    case 'reservations':
      category = 'reservations';
      break;
    case 'party-planning':
      category = 'party-planning';
      break;
    case 'costume-ideas':
      category = 'costume-ideas';
      break;
    case 'trick-or-treat-prep':
      category = 'trick-or-treat-prep';
      break;
    case 'resolutions':
      category = 'resolutions';
      break;
    case 'supplies-list':
      category = 'supplies-list';
      break;
    case 'games':
      category = 'games';
      break;
    default:
      category = values.category || null;
  }

  return {
    title: values.title || values.description || '',
    description: values.description || '',
    priority: values.priority || 'medium',
    category: category,
    due_date: values.due_date || values.dueDate || null,
    assigned_to: values.assigned_to || null,
  };
}

/**
 * Transform form values to guest list API payload
 */
export function transformGuestPayload(values: Record<string, any>, contacts: any[]) {
  const contact = contacts.find(
    c => c.name === values.recipient || c.name === values.name,
  );

  if (!contact) {
    throw new Error('Contact is required for guest list');
  }

  return {
    contact_id: contact.id,
    rsvp_status: values.rsvp_status || 'pending',
    notes: values.notes || '',
  };
}
