<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { AppsTray } from '@story-shack/ui'
import { Archive, Download, MonitorDown, Moon, Redo2, Sun, Undo2 } from 'lucide-vue-next'
import { useWorkspaceStore } from '../stores/workspace.js'
import { SUPPORTED_LOCALES } from '../i18n.js'

defineProps({ workspace: Boolean })
defineEmits(['export', 'trash'])

const store = useWorkspaceStore()
const deferredPrompt = ref(null)
const canInstall = ref(false)
const isInstalling = ref(false)
const isDevelopment = import.meta.env.DEV
const toggleTheme = () => store.setTheme(store.theme === 'basic' ? 'charcoal' : 'basic')

function handleBeforeInstallPrompt(event) {
  event.preventDefault()
  deferredPrompt.value = event
  canInstall.value = true
}
function handleAppInstalled() {
  canInstall.value = false
  deferredPrompt.value = null
}
onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)
  if (isDevelopment) window.setTimeout(() => { canInstall.value = true }, 500)
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.removeEventListener('appinstalled', handleAppInstalled)
})
async function install() {
  if (isDevelopment && !deferredPrompt.value) {
    isInstalling.value = true
    await new Promise((resolve) => window.setTimeout(resolve, 1000))
    isInstalling.value = false
    window.alert('In development mode, the install button is being simulated. In production, this opens the browser install prompt.')
    return
  }
  if (!deferredPrompt.value) return
  isInstalling.value = true
  try {
    await deferredPrompt.value.prompt()
    await deferredPrompt.value.userChoice
    deferredPrompt.value = null
    canInstall.value = false
  } finally {
    isInstalling.value = false
  }
}
</script>

<template>
  <header class="app-header">
    <RouterLink class="brand" to="/" aria-label="Story Shack Observatory home"><img class="brand-logo" src="/logo-64.webp" width="42" height="42" alt=""></RouterLink>
    <div v-if="workspace" class="header-project"><strong>{{ store.bundle?.project.title }}</strong><span :class="`save-${store.saveState}`">{{ $t(store.saveState) }}</span></div>
    <nav class="header-actions">
      <template v-if="workspace"><button class="icon-button" :disabled="!store.undoStack.length" :title="$t('undo')" @click="store.undo"><Undo2/></button><button class="icon-button" :disabled="!store.redoStack.length" :title="$t('redo')" @click="store.redo"><Redo2/></button><button class="icon-button" :title="$t('trash')" @click="$emit('trash')"><Archive/></button><button class="icon-button" :title="$t('export')" @click="$emit('export')"><Download/></button></template>
      <button v-if="canInstall" class="install-button" :disabled="isInstalling" :aria-label="$t('installApp')" @click="install"><MonitorDown/><span>{{ isInstalling ? $t('installing') : $t('installApp') }}</span></button>
      <select class="header-locale" :value="store.locale" aria-label="Language" @change="store.setLocale($event.target.value)"><option v-for="code in SUPPORTED_LOCALES" :key="code" :value="code">{{ code.toUpperCase() }}</option></select>
      <button class="icon-button" :title="$t('theme')" @click="toggleTheme"><Moon v-if="store.theme === 'basic'"/><Sun v-else/></button>
      <AppsTray />
    </nav>
  </header>
</template>
