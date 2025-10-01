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

const fs = require('fs');
const path = require('path');

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

const versionFilePath = path.join(__dirname, '../src/version.ts');

try {
  // Read the version file
  let content = fs.readFileSync(versionFilePath, 'utf8');
  
  // Extract current version
  const majorMatch = content.match(/major:\s*(\d+)/);
  const minorMatch = content.match(/minor:\s*(\d+)/);
  const patchMatch = content.match(/patch:\s*(\d+)/);
  
  if (!majorMatch || !minorMatch || !patchMatch) {
    throw new Error('Could not parse version numbers from version.ts');
  }
  
  let major = parseInt(majorMatch[1]);
  let minor = parseInt(minorMatch[1]);
  let patch = parseInt(patchMatch[1]);
  
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
  
  // Update version numbers in content
  content = content.replace(/major:\s*\d+/, `major: ${major}`);
  content = content.replace(/minor:\s*\d+/, `minor: ${minor}`);
  content = content.replace(/patch:\s*\d+/, `patch: ${patch}`);
  
  // Write back to file
  fs.writeFileSync(versionFilePath, content, 'utf8');
  
  console.log('✅ Version bumped successfully!');
  console.log(`   ${oldVersion} -> ${newVersion} (${versionType})`);
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
