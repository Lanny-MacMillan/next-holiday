const GLYPHS: Record<string, string> = {
  first_step: 'M5 21V4 M5 4h11l-2 4 2 4H5',
  task_tackler: 'M4 4h16v16H4z M8 12l3 3 5-6',
  gift_guru:
    'M4 9h16v4H4z M6 13h12v8H6z M12 9v12 M12 9c-2-4-6-3-4 0 M12 9c2-4 6-3 4 0',
  pen_pal: 'M3 6h18v12H3z M3 6l9 7 9-7',
  early_bird: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2',
  on_a_roll: 'M13 2L5 14h6l-1 8 8-12h-6z',
  week_warrior: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  rising_star:
    'M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z',
  holiday_hero:
    'M7 4h10v5a5 5 0 0 1-10 0z M7 6H4v2a3 3 0 0 0 3 3 M17 6h3v2a3 3 0 0 1-3 3 M12 14v4 M8 21h8',
};

interface BadgeIconProps {
  badgeKey: string;
  earned: boolean;
}

export default function BadgeIcon({ badgeKey, earned }: BadgeIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
        earned
          ? 'bg-emerald-600 text-white'
          : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={GLYPHS[badgeKey] ?? GLYPHS.first_step} />
      </svg>
    </span>
  );
}
