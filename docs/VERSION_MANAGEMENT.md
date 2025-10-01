# Version Management System

This project uses **Semantic Versioning** (SemVer) for version management.

## Version Format

`MAJOR.MINOR.PATCH` (e.g., 1.0.0)

- **MAJOR**: Breaking changes, incompatible API changes (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New features, backwards compatible (e.g., 1.0.0 → 1.1.0)
- **PATCH**: Bug fixes, backwards compatible (e.g., 1.0.0 → 1.0.1)

## How to Bump Version

### Using NPM Scripts (Recommended)

```bash
# For bug fixes and small improvements
npm run version:patch

# For new features
npm run version:minor

# For breaking changes
npm run version:major
```

### Manual Usage

```bash
node scripts/bump-version.js patch
node scripts/bump-version.js minor
node scripts/bump-version.js major
```

## After Bumping Version

1. **Update the changelog** in `src/version.ts`:
   ```typescript
   export const VERSION_HISTORY = [
     {
       version: '1.0.1',
       date: '2025-10-02',
       type: 'patch',
       changes: [
         'Fixed navigation bug',
         'Improved performance',
       ]
     },
     // ... previous versions
   ]
   ```

2. **Commit your changes**:
   ```bash
   git add .
   git commit -m "chore: bump version to 1.0.1"
   ```

3. **(Optional) Create a git tag**:
   
   Git tags mark specific points in your project's history and are useful for tracking releases:
   
   ```bash
   git tag v1.0.1
   git push && git push --tags
   ```
   
   **Why use tags?**
   - See all versions: `git tag -l`
   - Checkout specific version: `git checkout v1.0.1`
   - Compare versions: `git diff v1.0.0 v1.0.1`
   - GitHub/GitLab automatically create release pages for tags
   
   **Note:** Tags are optional but recommended for production releases!

## Version Display

The current version is displayed in the footer of the application. Users can click on the version number to see the full changelog with all version history.

## Examples

### Patch Version (Bug Fixes)
```bash
npm run version:patch
# 1.0.0 → 1.0.1
```

Example changes:
- Fixed exercise carousel navigation bug
- Improved loading performance
- Fixed typos in UI text

### Minor Version (New Features)
```bash
npm run version:minor
# 1.0.1 → 1.1.0
```

Example changes:
- Added dark mode support
- New statistics dashboard
- Export workout data feature

### Major Version (Breaking Changes)
```bash
npm run version:major
# 1.1.0 → 2.0.0
```

Example changes:
- Complete UI redesign
- Database schema changes requiring migration
- Removed deprecated features

## Current Version

**v1.0.0** - Initial Release (2025-10-01)

## Files Involved

- `src/version.ts` - Version numbers and changelog
- `scripts/bump-version.js` - Version bumping script
- `src/components/version-display.tsx` - UI component for displaying version
- `package.json` - NPM scripts for version management
