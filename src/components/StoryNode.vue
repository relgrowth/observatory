<script setup>
import { Handle, Position } from '@vue-flow/core'
defineProps({ data: Object, selected: Boolean })
</script>
<template><article :class="['story-node',{ 'is-selected': selected }]" :style="{'--node-color':data.color}"><Handle type="target" :position="Position.Left"/><small>{{ data.typeLabel }}</small><h3>{{ data.title }}</h3><p>{{ data.body || Object.values(data.fields || {}).find(Boolean) || 'A new point in the story.' }}</p><div class="tags"><span v-for="tag in data.tags?.slice(0,3)" :key="tag" class="tag">{{ tag }}</span></div><Handle type="source" :position="Position.Right"/></article></template>
