<script setup>
import { computed } from 'vue'
import { webMcpActivity } from '../services/webMcpState.js'
const visible = computed(() => webMcpActivity.value?.visible)
</script>
<template><Transition name="toast"><div v-if="visible" :class="['agent-toast', `is-${webMcpActivity.status}`]" role="status"><span class="agent-star">✦</span><div><strong>{{ webMcpActivity.title }}</strong><p>{{ webMcpActivity.message }}</p></div><button title="Dismiss notification" aria-label="Dismiss notification" @click="webMcpActivity.visible=false">×</button></div></Transition></template>
