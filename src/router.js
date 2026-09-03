import { createRouter, createWebHistory } from 'vue-router'
import LibraryView from './views/LibraryView.vue'

const MapView=()=>import('./views/MapView.vue')
const AboutView=()=>import('./views/AboutView.vue')

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'library', component: LibraryView },
    { path: '/maps/:id', name: 'map', component: MapView, props: true },
    { path: '/about', name: 'about', component: AboutView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
