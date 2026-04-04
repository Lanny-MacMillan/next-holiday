/**
 * Geolocation service for detecting user location
 */

import type { LocationInfo } from './types';

export class LocationService {
  private cachedLocation: LocationInfo | null = null;
  private fetchAttempted: boolean = false;

  async getLocationInfo(): Promise<LocationInfo> {
    // Return cached location if we have it
    if (this.cachedLocation) {
      return this.cachedLocation;
    }

    // Don't try again if we've already failed
    if (this.fetchAttempted) {
      return this.getBasicLocationInfo();
    }

    this.fetchAttempted = true;

    try {
      // Try to get location from timezone first (most reliable)
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // For more detailed location, try IP geolocation service with CORS handling
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch('https://ipapi.co/json/', {
          signal: controller.signal,
          mode: 'cors',
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const locationData = await response.json();
          this.cachedLocation = {
            timezone,
            country: locationData?.country_name,
            region: locationData?.region,
            city: locationData?.city,
          };
          return this.cachedLocation;
        }
      } catch (ipApiError) {
        // Silently handle CORS and other IP API errors
        console.warn('IP geolocation service unavailable, using timezone only');
      }

      // Cache the basic location info as fallback
      this.cachedLocation = this.getBasicLocationInfo();
      return this.cachedLocation;
    } catch (error) {
      // Ultimate fallback
      this.cachedLocation = this.getBasicLocationInfo();
      return this.cachedLocation;
    }
  }

  private getBasicLocationInfo(): LocationInfo {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
    };
  }
}
