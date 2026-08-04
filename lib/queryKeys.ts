export const queryKeys = {
  gallery: () => ["gallery"] as const,
  reactionState: (mediaId: string) => ["reaction-state", mediaId] as const,
  eventSchedule: () => ["event-schedule"] as const,
  headerSettings: () => ["header-settings"] as const,
  mapEnabled: () => ["map-enabled"] as const,
  geolocatedMedia: () => ["geolocated-media"] as const,
  streetViewUsage: () => ["street-view-usage"] as const,
};
