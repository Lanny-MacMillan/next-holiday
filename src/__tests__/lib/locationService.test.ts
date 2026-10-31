import { LocationService } from '@/lib/performance/location-service';

describe('LocationService', () => {
  it("gives the browser's time zone and no place names", async () => {
    const location = await new LocationService().getLocationInfo();

    expect(location).toEqual({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
    });
  });

  it('never makes a network request, so no visitor address leaves the site', async () => {
    const fetchSpy = jest.fn();
    const original = global.fetch;
    global.fetch = fetchSpy as unknown as typeof fetch;

    await new LocationService().getLocationInfo();
    await new LocationService().getLocationInfo();

    expect(fetchSpy).not.toHaveBeenCalled();
    global.fetch = original;
  });
});
