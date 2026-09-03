<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Map, MoreVertical, Plus } from 'lucide-vue-next'
import AppHeader from '../components/AppHeader.vue'
import StoryShackGateway from '../components/StoryShackGateway.vue'
import { useWorkspaceStore } from '../stores/workspace.js'

const store=useWorkspaceStore(),router=useRouter(),showCreate=ref(false),title=ref(''),description=ref(''),mapType=ref('dungeon'),showArchived=ref(false),openMenuId=ref(null)
const visibleProjects=computed(()=>store.projects.filter((project)=>Boolean(project.archivedAt)===showArchived.value&&!project.deletedAt))
async function create(){const project=await store.createNewProject({title:title.value,description:description.value,mapType:mapType.value});showCreate.value=false;router.push(`/maps/${project.id}`)}
const open=(id)=>router.push(`/maps/${id}`)
function toggleMenu(event,id){event.stopPropagation();openMenuId.value=openMenuId.value===id?null:id}
function closeMenus(){openMenuId.value=null}
function handleKeydown(event){if(event.key==='Escape'){showCreate.value=false;closeMenus()}}
async function rename(project){const value=prompt('Name this map',project.title);if(value?.trim())await store.patchProject(project.id,{title:value.trim()})}
onMounted(()=>{document.addEventListener('click',closeMenus);window.addEventListener('keydown',handleKeydown)});onBeforeUnmount(()=>{document.removeEventListener('click',closeMenus);window.removeEventListener('keydown',handleKeydown)})
</script>

<template>
  <main class="library-page"><AppHeader/><div class="library-content">
    <section class="library-intro"><div><a class="story-shack-kicker" href="https://thestoryshack.com/" target="_blank" rel="noopener noreferrer">A free creative tool from The Story Shack</a><h1>Build worlds one tile at a time</h1><p>Paint terrain, shape rooms and roads, place landmarks, and let your map grow naturally across an endless canvas.</p></div><button class="button primary intro-create" @click="showCreate=true"><Plus/>New map</button></section>
    <section class="library-toolbar"><div class="library-title-row"><h2>{{showArchived?'Archive':'Your maps'}}</h2><span>{{visibleProjects.length}}</span></div><div class="library-actions"><button class="button quiet" @click="showArchived=!showArchived">{{showArchived?'Your maps':'Archive'}}</button></div></section>
    <section class="project-grid"><article v-for="project in visibleProjects" :key="project.id" class="project-card map-project-card"><button class="project-card-main" :aria-label="`Open ${project.title}`" @click="open(project.id)"><span class="project-kind"><Map/>{{project.mapType}} map</span><h3>{{project.title}}</h3><p>{{project.description||'A blank map waiting for its first landmark.'}}</p><span class="project-meta"><span>Endless canvas</span><span>{{new Date(project.updatedAt).toLocaleDateString()}}</span></span></button><div class="project-overflow" @click.stop><button class="project-more" title="Map actions" aria-label="Map actions" :aria-expanded="openMenuId===project.id" @click="toggleMenu($event,project.id)"><MoreVertical/></button><div v-if="openMenuId===project.id" class="project-action-menu" role="menu"><button role="menuitem" @click="rename(project);closeMenus()">Rename</button><button role="menuitem" @click="store.duplicateProject(project.id);closeMenus()">Duplicate</button><button v-if="!showArchived" role="menuitem" @click="store.patchProject(project.id,{archivedAt:new Date().toISOString()});closeMenus()">Archive</button><button v-else role="menuitem" @click="store.patchProject(project.id,{archivedAt:null});closeMenus()">Restore</button><button class="danger" role="menuitem" @click="store.patchProject(project.id,{deletedAt:new Date().toISOString()});closeMenus()">Move to trash</button></div></div></article><div v-if="!visibleProjects.length" class="empty-state"><h3>{{showArchived?'No archived maps.':'Your atlas is empty.'}}</h3><button v-if="!showArchived" class="button primary" @click="showCreate=true">Create a map</button></div></section>
    <StoryShackGateway/>
  </div><div v-if="showCreate" class="modal-backdrop" @click.self="showCreate=false"><form class="modal" @submit.prevent="create"><span class="modal-eyebrow">New map</span><h2>Where are we going?</h2><div class="field"><label for="new-map-name">Map name</label><input id="new-map-name" v-model="title" required maxlength="200" autofocus placeholder="The Hollow Keep"></div><div class="field"><label for="new-map-description">Description</label><textarea id="new-map-description" v-model="description" maxlength="2000" placeholder="A flooded fortress beneath the old road…"></textarea></div><div class="field"><label for="new-map-type">Map type</label><select id="new-map-type" v-model="mapType"><option value="dungeon">Dungeon</option><option value="village">Village or city</option><option value="interior">Building interior</option><option value="wilderness">Wilderness</option><option value="world">World map</option></select></div><p class="local-note">Every map starts on an endless grid. Its export boundary grows with the content you add.</p><div class="modal-actions"><button type="button" class="button" @click="showCreate=false">Cancel</button><button class="button primary">Create map</button></div></form></div></main>
</template>
