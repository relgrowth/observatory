<script setup>
import { computed, reactive, watch } from 'vue'
import { CARD_TYPES, TYPE_MAP } from '../constants.js'
import { useWorkspaceStore } from '../stores/workspace.js'
const props=defineProps({item:Object}), store=useWorkspaceStore(), draft=reactive({})
const allTypes=computed(()=>[...CARD_TYPES,...(store.bundle?.cardTypes||[]).filter(x=>!x.deletedAt).map(x=>({id:x.typeId,fields:x.fields,displayName:x.displayName}))])
const currentType=computed(()=>allTypes.value.find(x=>x.id===draft.typeId))
watch(()=>props.item,(item)=>{for(const key of Object.keys(draft))delete draft[key]; if(item)Object.assign(draft,JSON.parse(JSON.stringify(item)))},{immediate:true})
async function save(){await store.updateCards([{...draft,tags:typeof draft.tags==='string'?draft.tags.split(',').map(x=>x.trim()).filter(Boolean):draft.tags}])}
async function imagePicked(event){const file=event.target.files?.[0];if(file)await store.manageMedia({action:draft.imageId?'replace':'attach',cardId:draft.id,blob:file,mime:file.type})}
</script>
<template><form v-if="item" @submit.prevent="save"><div class="field"><label>{{ $t('title') }}</label><input v-model="draft.title" maxlength="200" @change="save"></div><div class="field"><label>Type</label><select v-model="draft.typeId" @change="save"><option v-for="type in allTypes" :key="type.id" :value="type.id">{{ type.displayName||type.id }}</option></select></div><div class="field"><label>{{ $t('body') }}</label><textarea v-model="draft.body" maxlength="20000" @change="save"></textarea></div><div class="field-grid"><div v-for="field in currentType?.fields || []" :key="field" class="field"><label>{{ field }}</label><textarea v-model="draft.fields[field]" @change="save"></textarea></div></div><div class="field"><label>{{ $t('tags') }}</label><input :value="Array.isArray(draft.tags)?draft.tags.join(', '):draft.tags" @change="draft.tags=$event.target.value;save()"></div><div class="field"><label>Local image</label><input type="file" accept="image/png,image/jpeg,image/gif,image/webp" @change="imagePicked"><button v-if="draft.imageId" class="button" type="button" @click="store.manageMedia({action:'remove',cardId:draft.id})">Remove image</button></div><button class="button danger" type="button" @click="$emit('delete',item.id)">{{ $t('delete') }}</button></form></template>
