/**
 * Utility functions for performance monitoring
 */

export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getConnectionInfo(): any {
  // Handle experimental network connection API safely
  const nav = navigator as any;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

  if (connection) {
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }
  return null;
}

export function extractHolidayFromPath(path: string): string {
  const holidayMatch = path.match(
    /\/(christmas|birthday|valentines|halloween|thanksgiving|easter|mothers-day|fathers-day|graduation|anniversary|new-year|fourth-of-july|hanukkah|kwanzaa|baby-shower)/,
  );
  return holidayMatch ? holidayMatch[1] : 'home';
}
