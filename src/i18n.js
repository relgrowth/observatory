import { createI18n } from 'vue-i18n'

const en = {
  brand: 'Story Shack Observatory', tagline: 'See your story take shape.', library: 'Your observatories', newProject: 'New observatory', startBlank: 'Start blank', open: 'Open', duplicate: 'Duplicate', archive: 'Archive', restore: 'Restore', delete: 'Move to trash', purge: 'Delete permanently', rename: 'Rename', import: 'Import', export: 'Export', about: 'About & privacy', cards: 'story elements', emptyLibrary: 'A clear sky. Start with one bright idea.', title: 'Title', premise: 'Premise', create: 'Create', cancel: 'Cancel', confirm: 'Confirm', search: 'Search this story…', palette: 'Elements', inspector: 'Inspector', noSelection: 'Select a card or connection to explore it.', storyLenses: 'Story Lenses', noGaps: 'No structural gaps found.', relationships: 'Relationships', addRelationship: 'Connect', layout: 'Arrange', constellation: 'Constellation', storyFlow: 'Story flow', tidy: 'Tidy', undo: 'Undo', redo: 'Redo', saved: 'Saved locally', saving: 'Saving…', failed: 'Save failed', install: 'Install', theme: 'Switch theme', suite: 'Story Shack apps', trash: 'Trash', privacyLead: 'Your stories stay in this browser.', privacyBody: 'Observatory has no account, backend, cloud sync, telemetry, or error reporting. When you deliberately use a WebMCP read tool, the bounded content returned by that tool is shared with the browser agent you chose.', localOnly: 'Local-only by design', back: 'All observatories', addCard: 'Add {type}', body: 'Notes', tags: 'Tags', phase: 'Phase', sequence: 'Sequence', filterAll: 'All elements', archiveEmpty: 'No archived observatories.', externalChange: 'This observatory changed in another tab. Reload before editing.', requestStorage: 'Protect local storage', storageGranted: 'Persistent storage enabled', markdown: 'Markdown outline', archiveFile: 'Observatory archive', png: 'Canvas PNG', exportReady: 'Your export is ready.', updateReady: 'A new version is ready.', updateNow: 'Update now', later: 'Later', mobileHint: 'Spatial arrangement is available on a larger screen; every story element remains editable here.'
}
Object.assign(en, {
  tagline: 'See your story take shape',
  libraryByline: 'Bring characters, places, conflicts, and story beats together on one connected board.',
  observatoryLabel: 'Observatory',
  revision: 'Revision',
  projectActions: 'Project actions',
  installApp: 'Install app',
  installing: 'Installing…',
})
const overrides = {
  da:{tagline:'Se din historie tage form.',library:'Dine observatorier',newProject:'Nyt observatorium',startBlank:'Start tomt',open:'Åbn',cancel:'Annuller',search:'Søg i historien…',saved:'Gemt lokalt'},
  de:{tagline:'Sieh zu, wie deine Geschichte Gestalt annimmt.',library:'Deine Observatorien',newProject:'Neues Observatorium',startBlank:'Leer beginnen',open:'Öffnen',cancel:'Abbrechen',search:'Geschichte durchsuchen…',saved:'Lokal gespeichert'},
  es:{tagline:'Mira cómo toma forma tu historia.',library:'Tus observatorios',newProject:'Nuevo observatorio',startBlank:'Empezar en blanco',open:'Abrir',cancel:'Cancelar',search:'Buscar en la historia…',saved:'Guardado localmente'},
  fi:{tagline:'Näe tarinasi muotoutuvan.',library:'Observatoriosi',newProject:'Uusi observatorio',startBlank:'Aloita tyhjästä',open:'Avaa',cancel:'Peruuta',search:'Etsi tarinasta…',saved:'Tallennettu paikallisesti'},
  fr:{tagline:'Regardez votre histoire prendre forme.',library:'Vos observatoires',newProject:'Nouvel observatoire',startBlank:'Partir de zéro',open:'Ouvrir',cancel:'Annuler',search:'Rechercher dans l’histoire…',saved:'Enregistré localement'},
  it:{tagline:'Guarda la tua storia prendere forma.',library:'I tuoi osservatori',newProject:'Nuovo osservatorio',startBlank:'Inizia da zero',open:'Apri',cancel:'Annulla',search:'Cerca nella storia…',saved:'Salvato in locale'},
  ja:{tagline:'物語が形になる瞬間を見つめよう。',library:'あなたのオブザーバトリー',newProject:'新しいオブザーバトリー',startBlank:'白紙から始める',open:'開く',cancel:'キャンセル',search:'物語を検索…',saved:'端末に保存済み'},
  ko:{tagline:'이야기가 모습을 갖추는 순간을 바라보세요.',library:'나의 관측소',newProject:'새 관측소',startBlank:'빈 화면에서 시작',open:'열기',cancel:'취소',search:'이야기 검색…',saved:'기기에 저장됨'},
  nb:{tagline:'Se historien din ta form.',library:'Dine observatorier',newProject:'Nytt observatorium',startBlank:'Start tomt',open:'Åpne',cancel:'Avbryt',search:'Søk i historien…',saved:'Lagret lokalt'},
  nl:{tagline:'Zie je verhaal vorm krijgen.',library:'Jouw observatoria',newProject:'Nieuw observatorium',startBlank:'Leeg beginnen',open:'Openen',cancel:'Annuleren',search:'Doorzoek je verhaal…',saved:'Lokaal opgeslagen'},
  pl:{tagline:'Zobacz, jak Twoja opowieść nabiera kształtu.',library:'Twoje obserwatoria',newProject:'Nowe obserwatorium',startBlank:'Zacznij od zera',open:'Otwórz',cancel:'Anuluj',search:'Przeszukaj opowieść…',saved:'Zapisano lokalnie'},
  pt:{tagline:'Veja a sua história ganhar forma.',library:'Os seus observatórios',newProject:'Novo observatório',startBlank:'Começar do zero',open:'Abrir',cancel:'Cancelar',search:'Pesquisar na história…',saved:'Guardado localmente'},
  sv:{tagline:'Se din berättelse ta form.',library:'Dina observatorier',newProject:'Nytt observatorium',startBlank:'Börja tomt',open:'Öppna',cancel:'Avbryt',search:'Sök i berättelsen…',saved:'Sparat lokalt'}
}
const messages = Object.fromEntries(['da','de','en','es','fi','fr','it','ja','ko','nb','nl','pl','pt','sv'].map((locale) => [locale, { ...en, ...(overrides[locale] || {}) }]))
export const SUPPORTED_LOCALES = Object.keys(messages)
export default createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages })
