import fs from 'node:fs'
const source=fs.readFileSync(new URL('../src/i18n.js',import.meta.url),'utf8')
const locales=['da','de','en','es','fi','fr','it','ja','ko','nb','nl','pl','pt','sv']
for(const locale of locales)if(!source.includes(`${locale}:`)&&!source.includes(`'${locale}'`))throw new Error(`Missing locale ${locale}`)
console.log(`i18n parity: ${locales.length} locales configured`)
