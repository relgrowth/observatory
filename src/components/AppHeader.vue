<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Archive, BookOpen, Download, Hammer, Info, Map, Moon, MoreHorizontal, Redo2, Sparkles, Sun, Undo2, MonitorDown } from 'lucide-vue-next'
import { useWorkspaceStore } from '../stores/workspace.js'
import { SUPPORTED_LOCALES } from '../i18n.js'
defineProps({ workspace: Boolean })
defineEmits(['export', 'trash'])
const store = useWorkspaceStore(), suiteOpen = ref(false)
const installEvent = ref(null)
const toggleTheme = () => store.setTheme(store.theme === 'basic' ? 'charcoal' : 'basic')
onMounted(()=>window.addEventListener('beforeinstallprompt',(event)=>{event.preventDefault();installEvent.value=event},{once:true}))
async function install(){await installEvent.value?.prompt();installEvent.value=null}
</script>
<template>
  <header class="app-header">
    <RouterLink class="brand" to="/" aria-label="Story Shack Observatory home"><img class="brand-logo" src="/logo-64.webp" width="42" height="42" alt=""></RouterLink>
    <div v-if="workspace" class="header-project"><strong>{{ store.bundle?.project.title }}</strong><span :class="`save-${store.saveState}`">{{ $t(store.saveState) }}</span></div>
    <nav class="header-actions">
      <template v-if="workspace"><button class="icon-button" :disabled="!store.undoStack.length" :title="$t('undo')" @click="store.undo"><Undo2/></button><button class="icon-button" :disabled="!store.redoStack.length" :title="$t('redo')" @click="store.redo"><Redo2/></button><button class="icon-button" :title="$t('trash')" @click="$emit('trash')"><Archive/></button><button class="icon-button" :title="$t('export')" @click="$emit('export')"><Download/></button></template>
      <button v-if="installEvent" class="install-button" @click="install"><MonitorDown/><span>{{ $t('installApp') }}</span></button><button class="icon-button" :title="$t('theme')" @click="toggleTheme"><Moon v-if="store.theme === 'basic'"/><Sun v-else/></button>
      <div class="popover-host"><button class="icon-button" :aria-expanded="suiteOpen" :title="$t('suite')" @click="suiteOpen = !suiteOpen"><MoreHorizontal/></button><div v-if="suiteOpen" class="popover suite-popover"><strong>{{ $t('suite') }}</strong><select :value="store.locale" aria-label="Language" @change="store.setLocale($event.target.value)"><option v-for="code in SUPPORTED_LOCALES" :key="code" :value="code">{{ code.toUpperCase() }}</option></select><div class="suite-grid"><a href="https://writer.thestoryshack.com" target="_blank"><BookOpen/><span>Writer<small>Write and build worlds</small></span></a><a href="https://spark.thestoryshack.com" target="_blank"><Sparkles/><span>Spark<small>Guided writing exercises</small></span></a><a href="https://pathways.thestoryshack.com" target="_blank"><Map/><span>Pathways<small>Branching stories</small></span></a><a href="https://foundry.thestoryshack.com" target="_blank"><Hammer/><span>Foundry<small>Custom generators</small></span></a></div><RouterLink class="suite-about" to="/about" @click="suiteOpen=false"><Info/> {{ $t('about') }}</RouterLink></div></div>
    </nav>
  </header>
</template>
