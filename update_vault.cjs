const fs = require('fs');
const path = require('path');

const VAULT_DIR = path.join(__dirname, 'cache-vault');
const OUTPUT_FILE = path.join(__dirname, 'supabase', 'functions', 'whatsapp-webhook', 'vault.ts');

function generateVault() {
  const files = fs.readdirSync(VAULT_DIR).filter(f => f.endsWith('.md'));
  let content = '';

  files.forEach(file => {
    const varName = file.replace('.md', '').toUpperCase(); // SOP_ESCALADO, etc
    const text = fs.readFileSync(path.join(VAULT_DIR, file), 'utf8');
    content += `export const ${varName} = \`${text.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;\n\n`;
  });

  fs.writeFileSync(OUTPUT_FILE, content);
  console.log(`✅ Bóveda actualizada en: ${OUTPUT_FILE}`);
}

generateVault();
