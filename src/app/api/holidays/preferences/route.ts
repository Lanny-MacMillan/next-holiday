import { NextRequest } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { requireAccountAccess } from '@/lib/rbac';
import { toPlain } from '@/lib/json';
import { dateOnlyToUTC, toDateOnlyString } from '@/lib/dates';
import { ok, badRequest, serverError } from '@/lib/http';

// Validation schemas
const HolidayPreferenceSchema = z.object({
  holiday: z.string().min(1),
  budget: z.number().min(0).optional(),
  countdownTimer: z.string().datetime().optional(), // ISO datetime string
});

const SaveHolidayPreferencesSchema = z.object({
  accountId: z.string().min(1),
  preferences: z.array(HolidayPreferenceSchema),
});

// GET /api/holidays/preferences - Get holiday preferences for an account
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return badRequest('accountId is required');
    }

    // Check account access
    await requireAccountAccess(accountId, user.id);

    // Get current holidays with budgets for this account
    const holidays = await prisma.holiday.findMany({
      where: { accountId },
      include: {
        budgets: true,
      },
      orderBy: {
        holidayType: 'asc',
      },
    });

    // Transform to preferences format
    const preferences = holidays.map(holiday => ({
      holiday: holiday.holidayType,
      holidayId: holiday.id,
      budget: holiday.budgets[0]?.totalBudget
        ? parseFloat(holiday.budgets[0].totalBudget.toString())
        : undefined,
      countdownTimer: holiday.countdownTimer?.toISOString(),
    }));

    return ok(toPlain(preferences));
  } catch (error) {
    console.error('Error fetching holiday preferences:', error);
    return serverError('Failed to fetch holiday preferences');
  }
}

// POST /api/holidays/preferences - Save holiday preferences
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    // Parse and validate request body
    const body = await request.json();
    const validation = SaveHolidayPreferencesSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.issues);
    }

    const { accountId, preferences } = validation.data;

    // Check account access
    await requireAccountAccess(accountId, user.id);

    // Filter out wedding-related holidays to prevent them from being saved
    const validPreferences = preferences.filter(preference => {
      const holidayType = preference.holiday.toLowerCase();
      return !holidayType.includes('wedding');
    });

    // Deduplicate holidays by holiday type to prevent duplicate processing
    const deduplicatedPreferences = validPreferences.reduce(
      (acc, current) => {
        const existing = acc.find(item => item.holiday === current.holiday);
        if (!existing) {
          acc.push(current);
        } else {
          // Keep the one with budget if available, otherwise keep the first one
          if (current.budget && !existing.budget) {
            const index = acc.findIndex(item => item.holiday === current.holiday);
            acc[index] = current;
          }
        }
        return acc;
      },
      [] as typeof validPreferences,
    );

    // Process preferences in a transaction with increased timeout
    const results = await prisma.$transaction(
      async tx => {
        // Get current holidays for this account
        const currentHolidays = await tx.holiday.findMany({
          where: { accountId },
          include: {
            budgets: true,
          },
        });

        // Create sets of current and new holiday types for comparison
        const currentHolidayTypes = new Set(currentHolidays.map(h => h.holidayType));
        const newHolidayTypes = new Set(deduplicatedPreferences.map(p => p.holiday));

        // Find holidays to remove (in current but not in new preferences)
        const holidaysToRemove = currentHolidays.filter(
          h => !newHolidayTypes.has(h.holidayType),
        );

        // Remove holidays that are no longer selected (this will cascade delete budgets, tasks, etc.)
        for (const holiday of holidaysToRemove) {
          await tx.holiday.delete({
            where: { id: holiday.id },
          });
        }

        const holidayResults = [];

        for (const preference of deduplicatedPreferences) {
          const { holiday: holidayType, budget, countdownTimer } = preference;

          // Find existing holiday or create new one
          let holiday = await tx.holiday.findFirst({
            where: {
              accountId,
              holidayType,
            },
          });

          if (holiday) {
            // Update existing holiday
            holiday = await tx.holiday.update({
              where: { id: holiday.id },
              data: {
                countdownTimer: countdownTimer ? new Date(countdownTimer) : null,
                updatedAt: new Date(),
              },
            });
          } else {
            // Create new holiday
            holiday = await tx.holiday.create({
              data: {
                id: uuidv4(),
                accountId,
                holidayType,
                name: holidayType,
                startDate: dateOnlyToUTC(new Date().toISOString().slice(0, 10)), // Default to today
                colorLight: '#3B82F6', // Default blue
                colorDark: '#1E40AF',
                isCustom: false,
                createdBy: user.id,
                countdownTimer: countdownTimer ? new Date(countdownTimer) : null,
              },
            });
          }

          let budgetResult = null;

          // Handle budget - if budget is provided, create/update; if not provided, remove existing
          if (budget !== undefined) {
            let existingBudget = await tx.budget.findFirst({
              where: {
                holidayId: holiday.id,
              },
            });

            if (existingBudget) {
              // Update existing budget
              budgetResult = await tx.budget.update({
                where: { id: existingBudget.id },
                data: {
                  totalBudget: parseFloat(budget.toString()),
                  remainingAmount: parseFloat(budget.toString()),
                  updatedAt: new Date(),
                },
              });
            } else {
              // Create new budget
              budgetResult = await tx.budget.create({
                data: {
                  id: uuidv4(),
                  holidayId: holiday.id,
                  name: `${holidayType} Budget`,
                  totalBudget: parseFloat(budget.toString()),
                  spentAmount: 0,
                  remainingAmount: parseFloat(budget.toString()),
                  currency: 'USD',
                  startDate: dateOnlyToUTC(new Date().toISOString().slice(0, 10)),
                  endDate: dateOnlyToUTC(new Date().toISOString().slice(0, 10)),
                  createdBy: user.id,
                },
              });
            }
          } else {
            // If no budget is provided, remove any existing budget for this holiday
            const existingBudget = await tx.budget.findFirst({
              where: {
                holidayId: holiday.id,
              },
            });

            if (existingBudget) {
              await tx.budget.delete({
                where: { id: existingBudget.id },
              });
            }
          }

          holidayResults.push({
            holiday: {
              ...holiday,
              startDate: toDateOnlyString(holiday.startDate),
              endDate: toDateOnlyString(holiday.endDate),
              countdownTimer: holiday.countdownTimer?.toISOString() || null,
            },
            budget: budgetResult
              ? {
                  ...budgetResult,
                  startDate: toDateOnlyString(budgetResult.startDate),
                  endDate: toDateOnlyString(budgetResult.endDate),
                }
              : null,
          });
        }

        return holidayResults;
      },
      {
        timeout: 15000, // Increase timeout to 15 seconds for complex operations
        maxWait: 20000, // Maximum wait time for transaction to start
      },
    );

    return ok(toPlain(results));
  } catch (error) {
    console.error('Error saving holiday preferences:', error);
    if (error instanceof Error) {
      return serverError(error.message);
    }
    return serverError('Failed to save holiday preferences');
  }
}
