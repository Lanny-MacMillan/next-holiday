'use client';

import HolidayCard from '@/components/cards/HolidayCard';

export default function GamifiedHolidayCardExample() {
  // Example data
  const exampleHoliday = {
    id: 'christmas',
    name: 'Christmas',
    description: 'The most wonderful time of the year',
    route: '/christmas',
    color: {
      light: '#dc2626',
      dark: '#ef4444',
      progress: 'bg-red-500',
    },
    progress: 0.3, // 30% complete
    completedItems: 3,
    totalItems: 10,
  };

  const valentinesHoliday = {
    id: 'valentines',
    name: "Valentine's Day",
    description: 'Plan gifts, dates, and romantic surprises!',
    route: '/valentines',
    color: {
      light: '#ec4899',
      dark: '#f472b6',
      progress: 'bg-pink-400',
    },
    progress: 0.6, // 60% complete
    completedItems: 6,
    totalItems: 10,
  };

  const halloweenHoliday = {
    id: 'halloween',
    name: 'Halloween',
    description: 'Plan costumes, decorations, and trick-or-treating!',
    route: '/halloween',
    color: {
      light: '#f97316',
      dark: '#fb923c',
      progress: 'bg-orange-400',
    },
    progress: 0.9, // 90% complete
    completedItems: 9,
    totalItems: 10,
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
        HolidayCard Examples - Professional vs Gamified
      </h2>

      <div className="space-y-6">
        {/* Professional Mode Examples */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300 border-b pb-2">
            Professional Mode (gamified={false})
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold mb-2 text-gray-600 dark:text-gray-400">
                Christmas - Professional
              </h4>
              <HolidayCard {...exampleHoliday} gamified={false} />
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-2 text-gray-600 dark:text-gray-400">
                Valentine's Day - Professional
              </h4>
              <HolidayCard {...valentinesHoliday} gamified={false} />
            </div>
          </div>
        </div>

        {/* Gamified Mode Examples */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300 border-b pb-2">
            Gamified Mode (gamified={true})
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold mb-2 text-gray-600 dark:text-gray-400">
                Christmas - Gamified (Many tasks remaining)
              </h4>
              <HolidayCard {...exampleHoliday} gamified={true} />
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-2 text-gray-600 dark:text-gray-400">
                Valentine's Day - Gamified (Some tasks remaining)
              </h4>
              <HolidayCard {...valentinesHoliday} gamified={true} />
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-2 text-gray-600 dark:text-gray-400">
                Halloween - Gamified (Almost complete!)
              </h4>
              <HolidayCard {...halloweenHoliday} gamified={true} />
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-2 text-gray-600 dark:text-gray-400">
                Custom Blob SVG - Gamified
              </h4>
              <HolidayCard
                {...exampleHoliday}
                gamified={true}
                customBlobSvg="/custom-blob.svg"
              />
            </div>
          </div>
        </div>

        {/* Complete example */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300 border-b pb-2">
            Complete Holiday (No tasks!)
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold mb-2 text-gray-600 dark:text-gray-400">
                Complete Christmas - Professional
              </h4>
              <HolidayCard
                {...exampleHoliday}
                progress={1.0}
                completedItems={10}
                totalItems={10}
                gamified={false}
              />
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-2 text-gray-600 dark:text-gray-400">
                Complete Christmas - Gamified
              </h4>
              <HolidayCard
                {...exampleHoliday}
                progress={1.0}
                completedItems={10}
                totalItems={10}
                gamified={true}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
          How to Use:
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>
            • Pass <code>gamified={true}</code> prop to enable gamified mode
          </li>
          <li>
            • Pass <code>gamified={false}</code> prop to force professional mode
          </li>
          <li>
            • If no <code>gamified</code> prop is passed, it uses Redux settings
          </li>
          <li>
            • In gamified mode, each incomplete task is represented by an animated
            blob
          </li>
          <li>
            • Gamified cards have colorful backgrounds, holiday icons, and playful
            animations
          </li>
          <li>
            • Pass <code>customBlobSvg</code> prop to use your own SVG for blobs
          </li>
          <li>• The blobs animate with pulse effects and are positioned randomly</li>
          <li>• Progress bars and completion percentages are still shown</li>
        </ul>
      </div>
    </div>
  );
}
