import { FormConfig, FormField } from '../types/form';
import {
  BASE_FORM_CONFIGS,
  HOLIDAY_CUSTOMIZATIONS,
  ContentType,
  HolidayKey,
} from '../config/baseFormConfigs';

export interface ShareMember {
  userId: string;
  uuid: string; // User's UUID for assignments
  name?: string;
  email: string;
  role: 'owner' | 'collaborator';
}

export interface AuthUser {
  sub?: string;
  name?: string;
  email?: string;
}

/**
 * Enhances shareMembers array by adding the current user first for self-assignment functionality.
 * This ensures all holiday subpages have consistent assignTo dropdown behavior.
 * Only includes current user if they already exist in shareMembers with a valid UUID.
 */
export function enhanceShareMembersWithCurrentUser(
  baseMembers: ShareMember[],
  auth0User?: AuthUser | null,
): ShareMember[] {
  if (!auth0User?.sub || !baseMembers.length) {
    return baseMembers;
  }

  // Find current user in baseMembers by email (most reliable identifier)
  const existingCurrentUser = baseMembers.find(
    (member: any) => member.email === auth0User.email,
  );

  if (existingCurrentUser) {
    // Current user is already in the list with proper UUID, reorder to put them first
    return [
      {
        ...existingCurrentUser,
        name: existingCurrentUser.name || auth0User.name || 'Me',
        role: 'owner' as const,
      },
      ...baseMembers.filter((member: any) => member !== existingCurrentUser),
    ];
  }

  // If current user is not in shareMembers, don't add them - this means holiday is not shared
  // or user doesn't have proper UUID yet. Return baseMembers as-is.
  return baseMembers;
}

/**
 * Builds a form configuration for a specific content type and holiday,
 * with dynamic assignTo field population and holiday-specific customizations.
 */
export function buildFormConfig(
  contentType: ContentType,
  holidayKey?: HolidayKey,
  shareMembers: ShareMember[] = [],
  customizations?: Partial<FormConfig>,
): FormConfig {
  const baseConfig = BASE_FORM_CONFIGS[contentType];

  // Clone the base configuration to avoid mutations
  const config = JSON.parse(JSON.stringify(baseConfig)) as FormConfig;

  // Set form-level showAddressBook if any field has showAddressBook
  const hasAddressBookField = config.fields.some(
    (field: any) => field.showAddressBook,
  );
  if (hasAddressBookField) {
    (config as any).showAddressBook = true;
  }

  // Populate assignTo options with share members if there are any
  if (shareMembers.length > 0) {
    config.fields = config.fields.map((field: any) => {
      if (field.id === 'assigned_to') {
        return {
          ...field,
          options: [
            { value: '', label: 'Unassigned' },
            ...shareMembers.map(member => ({
              value: member.uuid, // Use UUID for API compatibility
              label: member.name || member.email || 'Unknown',
            })),
          ],
        };
      }
      return field;
    });
  } else {
    // Remove assignTo field if no share members (not shared holiday)
    config.fields = config.fields.filter((field: any) => field.id !== 'assigned_to');
  }

  // Apply holiday-specific customizations
  if (holidayKey && HOLIDAY_CUSTOMIZATIONS[holidayKey]) {
    const holidayConfig = HOLIDAY_CUSTOMIZATIONS[holidayKey];
    if (holidayConfig && contentType in holidayConfig) {
      const holidayCustomizations =
        holidayConfig[contentType as keyof typeof holidayConfig];
      Object.assign(config, holidayCustomizations);
    }
  }

  // Apply any additional customizations
  if (customizations) {
    Object.assign(config, customizations);
  }

  return config;
}

/**
 * Creates a standalone assignTo field for legacy compatibility
 */
export function buildAssignToField(shareMembers: ShareMember[]): FormField {
  return {
    id: 'assigned_to', // Changed from 'assignedTo' to match API
    type: 'select',
    placeholder: 'Assign to (optional)',
    options: [
      { value: '', label: 'Unassigned' },
      ...shareMembers.map(member => ({
        value: member.uuid, // Use UUID for API compatibility
        label: member.name || member.email || 'Unknown',
      })),
    ],
  };
}

/**
 * Utility function to check if a holiday should show assignTo fields
 */
export function shouldShowAssignTo(shareMembers: ShareMember[]): boolean {
  return shareMembers.length >= 1; // Show when there's at least one member (including self-assignment)
}

/**
 * Get available content types for a specific holiday
 */
export function getAvailableContentTypes(holidayKey?: HolidayKey): ContentType[] {
  // Most holidays support all content types
  const allTypes: ContentType[] = ['task', 'gift', 'card'];

  // Some holidays might not support certain content types
  // Add logic here if needed in the future
  return allTypes;
}

/**
 * Helper to get holiday-specific field customizations
 */
export function getHolidayFieldCustomizations(
  holidayKey: HolidayKey,
  contentType: ContentType,
): Partial<FormConfig> | undefined {
  const holidayConfig = HOLIDAY_CUSTOMIZATIONS[holidayKey];
  if (holidayConfig && contentType in holidayConfig) {
    return holidayConfig[contentType as keyof typeof holidayConfig];
  }
  return undefined;
}
