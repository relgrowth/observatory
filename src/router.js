import { createRouter, createWebHistory } from 'vue-router'
import LibraryView from './views/LibraryView.vue'
import ObservatoryView from './views/ObservatoryView.vue'
import AboutView from './views/AboutView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'library', component: LibraryView },
    { path: '/observatory/:id', name: 'observatory', component: ObservatoryView, props: true },
    { path: '/about', name: 'about', component: AboutView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
