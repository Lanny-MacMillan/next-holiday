import { FormConfig, FormField } from '../types/form';
import {
  BASE_FORM_CONFIGS,
  HOLIDAY_CUSTOMIZATIONS,
  ContentType,
  HolidayKey,
} from '../config/baseFormConfigs';

export interface ShareMember {
  userId: string;
  name?: string;
  email: string;
  role: 'owner' | 'collaborator';
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

  // Populate assignTo options with share members if there are any
  if (shareMembers.length > 0) {
    config.fields = config.fields.map((field: any) => {
      if (field.id === 'assigned_to') {
        return {
          ...field,
          options: [
            { value: '', label: 'Unassigned' },
            ...shareMembers.map(member => ({
              value: member.userId,
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
        value: member.userId,
        label: member.name || member.email || 'Unknown',
      })),
    ],
  };
}

/**
 * Utility function to check if a holiday should show assignTo fields
 */
export function shouldShowAssignTo(shareMembers: ShareMember[]): boolean {
  return shareMembers.length > 1; // More than just the owner
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
