<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { MoreVertical, Plus, Upload } from 'lucide-vue-next'
import AppHeader from '../components/AppHeader.vue'
import { useWorkspaceStore } from '../stores/workspace.js'
import { importObservatory } from '../services/portability.js'

const store = useWorkspaceStore()
const router = useRouter()
const showCreate = ref(false)
const title = ref('')
const premise = ref('')
const showArchived = ref(false)
const input = ref()
const openMenuId = ref(null)
const visibleProjects = computed(() => store.projects.filter((project) => Boolean(project.archivedAt) === showArchived.value && !project.deletedAt))

async function create() {
  const project = await store.createNewProject({ title: title.value, premise: premise.value })
  showCreate.value = false
  title.value = ''
  premise.value = ''
  router.push(`/observatory/${project.id}`)
}
function open(id) { router.push(`/observatory/${id}`) }
async function rename(project) {
  const value = prompt('Name this observatory', project.title)
  if (value?.trim()) await store.patchProject(project.id, { title: value.trim() })
}
async function importFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const project = await importObservatory(file)
  await store.refreshProjects()
  router.push(`/observatory/${project.id}`)
  event.target.value = ''
}
function toggleMenu(event, id) {
  event.stopPropagation()
  openMenuId.value = openMenuId.value === id ? null : id
}
function closeMenus() { openMenuId.value = null }
onMounted(() => document.addEventListener('click', closeMenus))
onBeforeUnmount(() => document.removeEventListener('click', closeMenus))
</script>

<template>
  <main class="library-page">
    <AppHeader />
    <div class="library-content">
      <section class="library-intro">
        <div>
          <h1>{{ $t('tagline') }}</h1>
          <p>{{ $t('libraryByline') }}</p>
        </div>
        <button class="button primary intro-create" @click="showCreate = true"><Plus />{{ $t('newProject') }}</button>
      </section>

      <section class="library-toolbar">
        <div class="library-title-row"><h2>{{ showArchived ? $t('archive') : $t('library') }}</h2><span>{{ visibleProjects.length }}</span></div>
        <div class="library-actions">
          <button class="button quiet" @click="showArchived = !showArchived">{{ showArchived ? $t('library') : $t('archive') }}</button>
          <input ref="input" hidden type="file" accept=".observatory" @change="importFile">
          <button class="button" @click="input.click()"><Upload />{{ $t('import') }}</button>
        </div>
      </section>

      <section class="project-grid">
        <article v-for="project in visibleProjects" :key="project.id" class="project-card">
          <button class="project-card-main" :aria-label="`${$t('open')} ${project.title}`" @click="open(project.id)">
            <span class="project-kind">{{ $t('observatoryLabel') }}</span>
            <h3>{{ project.title }}</h3>
            <p>{{ project.premise || $t('emptyLibrary') }}</p>
            <span class="project-meta"><span>{{ $t('revision') }} {{ project.revision }}</span><span>{{ new Date(project.updatedAt).toLocaleDateString() }}</span></span>
          </button>
          <div class="project-overflow" @click.stop>
            <button class="project-more" :aria-label="$t('projectActions')" :aria-expanded="openMenuId === project.id" @click="toggleMenu($event, project.id)"><MoreVertical /></button>
            <div v-if="openMenuId === project.id" class="project-action-menu" role="menu">
              <button role="menuitem" @click="rename(project); closeMenus()">{{ $t('rename') }}</button>
              <button role="menuitem" @click="store.duplicateProject(project.id); closeMenus()">{{ $t('duplicate') }}</button>
              <button v-if="!showArchived" role="menuitem" @click="store.patchProject(project.id, { archivedAt: new Date().toISOString() }); closeMenus()">{{ $t('archive') }}</button>
              <button v-else role="menuitem" @click="store.patchProject(project.id, { archivedAt: null }); closeMenus()">{{ $t('restore') }}</button>
              <button class="danger" role="menuitem" @click="store.patchProject(project.id, { deletedAt: new Date().toISOString() }); closeMenus()">{{ $t('delete') }}</button>
            </div>
          </div>
        </article>
        <div v-if="!visibleProjects.length" class="empty-state"><h3>{{ showArchived ? $t('archiveEmpty') : $t('emptyLibrary') }}</h3><button v-if="!showArchived" class="button primary" @click="showCreate = true">{{ $t('startBlank') }}</button></div>
      </section>
    </div>

    <div v-if="showCreate" class="modal-backdrop" @click.self="showCreate = false">
      <form class="modal" @submit.prevent="create">
        <h2>{{ $t('newProject') }}</h2>
        <div class="field"><label>{{ $t('title') }}</label><input v-model="title" required maxlength="200" autofocus></div>
        <div class="field"><label>{{ $t('premise') }}</label><textarea v-model="premise" maxlength="20000"></textarea></div>
        <div class="modal-actions"><button type="button" class="button" @click="showCreate = false">{{ $t('cancel') }}</button><button class="button primary">{{ $t('create') }}</button></div>
      </form>
    </div>
  </main>
</template>
