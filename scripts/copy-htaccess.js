import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const source = resolve(process.cwd(), 'public', '.htaccess')
const target = resolve(process.cwd(), 'dist', '.htaccess')

if (!existsSync(source)) {
  console.warn('copy-htaccess: source file not found:', source)
  process.exit(0)
}

copyFileSync(source, target)
console.log('copy-htaccess: copied', source, '->', target)
