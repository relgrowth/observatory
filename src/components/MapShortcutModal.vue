<script setup>
defineProps({ tools:{type:Array,required:true}, shortcuts:{type:Object,required:true} })
defineEmits(['close'])
</script>
<template><div class="modal-backdrop shortcut-backdrop" @click.self="$emit('close')"><section class="modal shortcut-modal" role="dialog" aria-modal="true" aria-labelledby="shortcut-title"><header><div><small class="modal-eyebrow">Map editor</small><h2 id="shortcut-title">Keyboard shortcuts</h2></div><button class="icon-button" title="Close" aria-label="Close shortcuts" @click="$emit('close')">×</button></header><div class="shortcut-list"><div v-for="tool in tools" :key="tool.id"><span>{{tool.label}}</span><kbd>{{shortcuts[tool.id]}}</kbd></div><div><span>Temporarily pan</span><kbd>Space</kbd></div><div><span>Undo</span><kbd>⌘/Ctrl Z</kbd></div><div><span>Redo</span><kbd>⌘/Ctrl ⇧ Z</kbd></div></div></section></div></template>
