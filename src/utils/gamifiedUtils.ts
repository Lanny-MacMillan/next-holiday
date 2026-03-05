// Shared utility functions for gamified card components

export const getGamifiedBackgroundColor = (holiday?: string) => {
  const gradientMap: { [key: string]: string } = {
    christmas: 'bg-gradient-to-br from-red-400 to-red-600',
    hanukkah: 'bg-gradient-to-br from-blue-400 to-blue-600',
    kwanzaa: 'bg-gradient-to-br from-red-400 to-red-600',
    'new-year': 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    'new year': 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    valentines: 'bg-gradient-to-br from-pink-300 to-pink-500',
    "valentine's day": 'bg-gradient-to-br from-pink-300 to-pink-500',
    easter: 'bg-gradient-to-br from-purple-300 to-purple-500',
    halloween: 'bg-gradient-to-br from-orange-400 to-orange-600',
    thanksgiving: 'bg-gradient-to-br from-amber-400 to-amber-600',
    'mothers-day': 'bg-gradient-to-br from-pink-300 to-pink-500',
    "mother's day": 'bg-gradient-to-br from-pink-300 to-pink-500',
    'fathers-day': 'bg-gradient-to-br from-blue-300 to-blue-500',
    "father's day": 'bg-gradient-to-br from-blue-300 to-blue-500',
    'fourth-of-july': 'bg-gradient-to-br from-red-400 to-red-600',
    'fourth of july': 'bg-gradient-to-br from-red-400 to-red-600',
    birthday: 'bg-gradient-to-br from-yellow-300 to-yellow-500',
    anniversary: 'bg-gradient-to-br from-pink-300 to-pink-500',
    graduation: 'bg-gradient-to-br from-purple-300 to-purple-500',
    'baby-shower': 'bg-gradient-to-br from-cyan-300 to-cyan-500',
    'baby shower': 'bg-gradient-to-br from-cyan-300 to-cyan-500',
  };
  return (
    gradientMap[holiday?.toLowerCase() || ''] ||
    'bg-gradient-to-br from-gray-400 to-gray-600'
  );
};

// Task priority-based background colors
export const getTaskGamifiedBackgroundColor = (priority: string) => {
  const gradientMap: { [key: string]: string } = {
    high: 'bg-gradient-to-br from-red-400 to-red-600',
    medium: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    low: 'bg-gradient-to-br from-green-400 to-green-600',
  };
  return gradientMap[priority] || 'bg-gradient-to-br from-gray-400 to-gray-600';
};

// Gift price-based background colors
export const getGiftGamifiedBackgroundColor = (price: number) => {
  const gradientMap: { [key: string]: string } = {
    expensive: 'bg-gradient-to-br from-purple-400 to-purple-600', // $100+
    moderate: 'bg-gradient-to-br from-blue-400 to-blue-600', // $50-99
    affordable: 'bg-gradient-to-br from-green-400 to-green-600', // $25-49
    budget: 'bg-gradient-to-br from-yellow-400 to-yellow-600', // <$25
  };

  if (price >= 100) return gradientMap.expensive;
  if (price >= 50) return gradientMap.moderate;
  if (price >= 25) return gradientMap.affordable;
  return gradientMap.budget;
};

// Card mail-themed background color
export const getCardGamifiedBackgroundColor = () => {
  return 'bg-gradient-to-br from-green-400 to-green-600';
};
