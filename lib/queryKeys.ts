export const queryKeys = {
  gallery: () => ["gallery"] as const,
  reactionState: (mediaId: string) => ["reaction-state", mediaId] as const,
  eventSchedule: () => ["event-schedule"] as const,
  headerSettings: () => ["header-settings"] as const,
};
