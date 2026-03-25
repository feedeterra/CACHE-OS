const fs = require('fs')
const path = require('path')

const vaultDir = './cache-vault'
const outPath = './supabase/functions/whatsapp-webhook/vault.ts'

const files = fs.readdirSync(vaultDir).filter(f => f.endsWith('.md'))
let output = ''

for (const file of files) {
  const content = fs.readFileSync(path.join(vaultDir, file), 'utf8')
  const varName = file.replace('.md', '').toUpperCase()
  output += `export const ${varName} = \`${content.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;\n\n`
}

fs.writeFileSync(outPath, output)
console.log('vault.ts updated!')
