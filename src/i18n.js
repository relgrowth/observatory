import { createI18n } from 'vue-i18n'
const en={brand:'Story Shack Mapworks',undo:'Undo',redo:'Redo',trash:'Trash',export:'Export',installApp:'Install app',installing:'Installing…',theme:'Switch theme',saved:'Saved locally',saving:'Saving…',failed:'Save failed',updateReady:'A new version is ready.',updateNow:'Update now'}
const overrides={
da:{saved:'Gemt lokalt'},de:{saved:'Lokal gespeichert'},es:{saved:'Guardado localmente'},fi:{saved:'Tallennettu paikallisesti'},fr:{saved:'Enregistré localement'},it:{saved:'Salvato in locale'},ja:{saved:'端末に保存済み'},ko:{saved:'기기에 저장됨'},nb:{saved:'Lagret lokalt'},nl:{saved:'Lokaal opgeslagen'},pl:{saved:'Zapisano lokalnie'},pt:{saved:'Guardado localmente'},sv:{saved:'Sparat lokalt'},
}
const locales=['da','de','en','es','fi','fr','it','ja','ko','nb','nl','pl','pt','sv']
const messages=Object.fromEntries(locales.map((locale)=>[locale,{...en,...(overrides[locale]||{})}]))
export const SUPPORTED_LOCALES=locales
export default createI18n({legacy:false,locale:'en',fallbackLocale:'en',messages})
