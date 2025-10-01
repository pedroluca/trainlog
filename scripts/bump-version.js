#!/usr/bin/env node

/**
 * Version Manager Script
 * Usage: node scripts/bump-version.js [major|minor|patch]
 * 
 * Examples:
 *   node scripts/bump-version.js patch  -> 1.0.0 to 1.0.1
 *   node scripts/bump-version.js minor  -> 1.0.0 to 1.1.0
 *   node scripts/bump-version.js major  -> 1.0.0 to 2.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const versionType = args[0];

if (!versionType || !['major', 'minor', 'patch'].includes(versionType)) {
  console.error('❌ Error: Please specify version type: major, minor, or patch');
  console.log('\nUsage:');
  console.log('  node scripts/bump-version.js patch  -> Bump patch version (bug fixes)');
  console.log('  node scripts/bump-version.js minor  -> Bump minor version (new features)');
  console.log('  node scripts/bump-version.js major  -> Bump major version (breaking changes)');
  process.exit(1);
}

const packageJsonPath = path.join(__dirname, '../package.json');
const versionFilePath = path.join(__dirname, '../src/version.ts');

try {
  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version;
  
  // Parse version
  let [major, minor, patch] = currentVersion.split('.').map(Number);
  const oldVersion = `${major}.${minor}.${patch}`;
  
  // Bump version based on type
  switch (versionType) {
    case 'major':
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor += 1;
      patch = 0;
      break;
    case 'patch':
      patch += 1;
      break;
  }
  
  const newVersion = `${major}.${minor}.${patch}`;
  
  // Update package.json
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
  
  // Update version.ts
  let versionContent = fs.readFileSync(versionFilePath, 'utf8');
  versionContent = versionContent.replace(/major:\s*\d+/, `major: ${major}`);
  versionContent = versionContent.replace(/minor:\s*\d+/, `minor: ${minor}`);
  versionContent = versionContent.replace(/patch:\s*\d+/, `patch: ${patch}`);
  fs.writeFileSync(versionFilePath, versionContent, 'utf8');
  
  console.log('✅ Version bumped successfully!');
  console.log(`   ${oldVersion} -> ${newVersion} (${versionType})`);
  console.log('\n📝 Files updated:');
  console.log('   ✓ package.json');
  console.log('   ✓ src/version.ts');
  console.log('\n📝 Next steps:');
  console.log('   1. Update VERSION_HISTORY in src/version.ts with your changes');
  console.log('   2. Commit your changes: git commit -am "chore: bump version to ' + newVersion + '"');
  console.log('   3. (Optional) Create a git tag: git tag v' + newVersion);
  console.log('   4. (Optional) Push with tags: git push && git push --tags');
  console.log('\n💡 Tip: Git tags are optional but recommended for tracking releases!');
  
} catch (error) {
  console.error('❌ Error bumping version:', error.message);
  process.exit(1);
}
