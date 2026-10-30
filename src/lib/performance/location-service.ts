/**
 * Where a visitor is, as far as the browser itself says: their time zone. The country,
 * region and city are not looked up, because that would send every visitor's IP address to a
 * third party.
 */

import type { LocationInfo } from './types';

export class LocationService {
  async getLocationInfo(): Promise<LocationInfo> {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
    };
  }
}
