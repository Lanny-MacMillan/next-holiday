import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useAppSelector } from '@/store/hooks';
import { useBudgetInfo } from '@/components/common/BudgetDisplay';
import GiftListCard from '@/components/cards/gift/GiftListCard';
import HolidayTaskCard from '@/components/cards/holiday-task/HolidayTaskCard';
import GuestListCard from '@/components/cards/guest/GuestListCard';
import HolidayHeader from '@/components/common/HolidayHeader';
import Footer from '@/components/common/Footer';

interface HolidaySubsection {
  name: string;
  description: string;
  href: string;
  sliceKey: string;
  type: 'gift-list' | 'guest-list' | 'task';
  category?: string;
}

interface HolidayPageTemplateProps {
  holidayName: string;
  description: string;
  subsections: HolidaySubsection[];
  theme: {
    primaryColor: string;
    accentColor: string;
    progressColor?: string;
  };
  gradientClass: string;
  gamifiedBackgroundColor: string;
  holidayColor?: string;
}

/**
 * Reusable holiday page template that uses useHolidayPageData hook
 * This template can be used to create any holiday page with minimal code duplication
 */
export function HolidayPageTemplate({
  holidayName,
  description,
  subsections,
  theme,
  gradientClass,
  gamifiedBackgroundColor,
  holidayColor,
}: HolidayPageTemplateProps) {
  // All the common logic is now centralized in this hook
  const { holidayData, getProgressData, holidayId } = useHolidayPageData();

  // Use the same budget calculation logic as BudgetDisplay component
  const budgetInfo = useBudgetInfo(holidayName, holidayId || undefined);

  // Get display mode from Redux to determine styling
  const { settings } = useAppSelector((state: any) => state.theme);
  const { preferences } = useAppSelector((state: any) => state.userPreferences);
  const isGamifiedMode =
    preferences?.displayMode === 'gamified' || settings.displayMode === 'gamified';

  return (
    <div
      className={`min-h-screen ${gradientClass} flex flex-col items-center p-4 sm:p-8 font-sans`}
    >
      <HolidayHeader holidayName={holidayName} description={description} />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        <ul className="flex flex-col gap-4">
          {subsections.map(section => {
            // Only apply category formatting for tasks sliceKey to avoid breaking existing holidays
            const progressKey = (section.sliceKey === 'tasks' && section.category) 
              ? `${section.sliceKey}:${section.category}` 
              : section.sliceKey;
            const { total, completed } = getProgressData(progressKey);

            // Render appropriate card based on section type
            if (section.type === 'gift-list') {
              return (
                <li key={section.name}>
                  <GiftListCard
                    holiday={holidayName}
                    href={section.href}
                    budget={{
                      spent: budgetInfo.totalSpent,
                      planned: budgetInfo.totalPlanned,
                      total: budgetInfo.budgetLimit,
                      remaining: budgetInfo.remaining,
                      percentage: budgetInfo.percentageUsed,
                    }}
                    giftList={{
                      totalItems: total,
                      completedItems: completed,
                    }}
                    theme={theme}
                    gamifiedBackgroundColor={gamifiedBackgroundColor}
                  />
                </li>
              );
            }

            if (section.type === 'guest-list') {
              return (
                <li key={section.name}>
                  <GuestListCard
                    holiday={holidayName}
                    href={section.href}
                    theme={theme}
                    gamified={isGamifiedMode} // Respect display mode setting
                    holidayColor={holidayColor || gamifiedBackgroundColor}
                  />
                </li>
              );
            }

            // Default to task card - pass gamified prop based on display mode
            return (
              <li key={section.name}>
                <HolidayTaskCard
                  holidayName={holidayName}
                  sectionName={section.name}
                  description={section.description}
                  href={section.href}
                  totalItems={total}
                  completedItems={completed}
                  theme={theme}
                  gamified={isGamifiedMode} // Pass display mode to task cards
                  gamifiedBackgroundColor={gamifiedBackgroundColor}
                />
              </li>
            );
          })}
        </ul>
      </main>

      <Footer />
    </div>
  );
}
