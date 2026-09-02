<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterView } from 'vue-router'
import { useWorkspaceStore } from './stores/workspace.js'
import WebMcpActivity from './components/WebMcpActivity.vue'
import router from './router.js'
import { useWebMcp } from './services/webMcp.js'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const store = useWorkspaceStore(), i18n = useI18n()
const { needRefresh, updateServiceWorker } = useRegisterSW()
const themeClass = computed(() => `theme-${store.theme}`)
let stopWebMcp
onMounted(async () => { await store.initialize(); if (i18n.availableLocales.includes(store.locale)) i18n.locale.value = store.locale; stopWebMcp = useWebMcp(store, router) })
watch(() => store.theme, (value) => { document.documentElement.dataset.theme = value }, { immediate: true })
watch(() => store.locale, (value) => { i18n.locale.value = i18n.availableLocales.includes(value) ? value : 'en'; document.documentElement.lang = i18n.locale.value }, { immediate: true })
onBeforeUnmount(() => { stopWebMcp?.(); store.dispose() })
</script>
<template><div :class="['app-shell', themeClass]"><RouterView v-if="store.ready"/><div v-else class="boot"><img class="boot-logo" src="/logo-128.webp" width="96" height="96" alt=""><p>Unrolling the map…</p></div><div v-if="needRefresh" class="agent-toast"><span class="agent-star">✦</span><div><strong>{{ $t('updateReady') }}</strong><p>Your local maps are safe. Update when you are ready.</p></div><button @click="updateServiceWorker(true)">{{ $t('updateNow') }}</button></div><WebMcpActivity/></div></template>
