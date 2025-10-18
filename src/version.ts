// Semantic Versioning: MAJOR.MINOR.PATCH
// MAJOR: Breaking changes, incompatible API changes
// MINOR: New features, backwards compatible
// PATCH: Bug fixes, backwards compatible

export const APP_VERSION = {
  major: 1,
  minor: 14,
  patch: 1,
}

export const getVersion = (): string => {
  return `${APP_VERSION.major}.${APP_VERSION.minor}.${APP_VERSION.patch}`
}

export const getVersionWithPrefix = (): string => {
  return `v${getVersion()}`
}

// Version history / Changelog
export const VERSION_HISTORY = [
  {
    version: '1.0.0',
    date: '2025-10-01',
    type: 'major' as const,
    changes: [
      'Initial release',
      'Workout tracking system',
      'Exercise logging',
      'Progress visualization',
      'Carousel navigation for exercises',
    ]
  }
]

export type VersionType = 'major' | 'minor' | 'patch'

export interface VersionHistoryEntry {
  version: string
  date: string
  type: VersionType
  changes: string[]
}
