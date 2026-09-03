<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Download, ExternalLink, Info, Keyboard, MonitorDown, Moon, MoreHorizontal, Redo2, Sun, Undo2 } from 'lucide-vue-next'
import { useWorkspaceStore } from '../stores/workspace.js'

defineProps({ workspace: Boolean })
defineEmits(['export','shortcuts'])

const store = useWorkspaceStore()
const deferredPrompt = ref(null)
const canInstall = ref(false)
const isInstalling = ref(false)
const menuOpen = ref(false)
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
function handleKeydown(event) { if (event.key === 'Escape') closeMenu() }
onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)
  document.addEventListener('click', closeMenu)
  window.addEventListener('keydown', handleKeydown)
  if (isDevelopment) window.setTimeout(() => { canInstall.value = true }, 500)
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.removeEventListener('appinstalled', handleAppInstalled)
  document.removeEventListener('click', closeMenu)
  window.removeEventListener('keydown', handleKeydown)
})
function closeMenu() { menuOpen.value = false }
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
    <RouterLink class="brand" to="/" title="Observatory home" aria-label="Observatory home"><img class="brand-logo" src="/logo-64.webp" width="42" height="42" alt=""></RouterLink>
    <div v-if="workspace" class="header-project"><strong>{{ store.bundle?.project.title }}</strong><span :class="`save-${store.saveState}`">{{ $t(store.saveState) }}</span></div>
    <nav class="header-actions">
      <template v-if="workspace"><button class="icon-button tooltip-control" :disabled="!store.undoStack.length" title="Undo" data-tooltip="Undo" aria-label="Undo" @click="store.undo"><Undo2/></button><button class="icon-button tooltip-control" :disabled="!store.redoStack.length" title="Redo" data-tooltip="Redo" aria-label="Redo" @click="store.redo"><Redo2/></button><button class="icon-button tooltip-control" title="Export map" data-tooltip="Export map" aria-label="Export map" @click="$emit('export')"><Download/></button></template>
      <button v-if="!workspace && canInstall" class="install-button" :disabled="isInstalling" :aria-label="$t('installApp')" @click="install"><MonitorDown/><span>{{ isInstalling ? $t('installing') : $t('installApp') }}</span></button>
      <button class="icon-button tooltip-control" title="Switch theme" data-tooltip="Switch theme" aria-label="Switch theme" @click="toggleTheme"><Moon v-if="store.theme === 'basic'"/><Sun v-else/></button>
      <div class="header-more" @click.stop>
        <button class="icon-button tooltip-control tooltip-align-end" title="More options" data-tooltip="More options" aria-label="More options" :aria-expanded="menuOpen" @click="menuOpen=!menuOpen"><MoreHorizontal/></button>
        <div v-if="menuOpen" class="header-menu" role="menu">
          <button v-if="workspace" role="menuitem" @click="$emit('shortcuts');closeMenu()"><Keyboard/>Keyboard shortcuts</button>
          <RouterLink role="menuitem" to="/about" @click="closeMenu"><Info/>About and privacy</RouterLink>
          <a role="menuitem" href="https://thestoryshack.com/" target="_blank" rel="noopener noreferrer"><ExternalLink/>Story Shack</a>
        </div>
      </div>
    </nav>
  </header>
</template>
