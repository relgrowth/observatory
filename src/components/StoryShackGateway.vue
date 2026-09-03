<script setup>
import { ArrowUpRight } from 'lucide-vue-next'

defineProps({ compact: Boolean })

const apps = [
  { id: 'quarry', name: 'Quarry', eyebrow: 'Worldbuilding & drafting', copy: 'Turn this map into a living setting with characters, lore, scenes, and a complete draft.', action: 'Write the story', url: 'https://quarry.thestoryshack.com/?lang=en', logo: '/app-logos/quarry.webp' },
  { id: 'junction', name: 'Junction', eyebrow: 'Branching story builder', copy: 'Build a playable adventure through its locations, choices, resources, and consequences.', action: 'Make it playable', url: 'https://junction.thestoryshack.com/?lang=en', logo: '/app-logos/junction.webp' },
  { id: 'story-shack', name: 'Story Shack', eyebrow: 'Generators & writing tools', copy: 'Find names, characters, creatures, and plot ideas that belong in the world you mapped.', action: 'Discover an idea', url: 'https://thestoryshack.com/tools/', logo: '/app-logos/story-shack.webp' },
]
</script>

<template>
  <section :class="['story-shack-gateway',{compact}]" aria-labelledby="story-shack-gateway-title">
    <header><div><span>Continue your world</span><h2 id="story-shack-gateway-title">{{compact?'Where does the story go next?':'The map is only the beginning.'}}</h2><p>Carry your places into the rest of The Story Shack’s creative toolkit.</p></div><a class="gateway-all-apps" href="https://thestoryshack.com/apps/" target="_blank" rel="noopener noreferrer">Explore all apps<ArrowUpRight aria-hidden="true"/></a></header>
    <div class="gateway-app-grid"><a v-for="app in compact?apps.slice(0,2):apps" :key="app.id" class="gateway-app-card" :href="app.url" target="_blank" rel="noopener noreferrer"><span class="gateway-app-icon"><img :src="app.logo" alt="" aria-hidden="true"></span><span class="gateway-app-copy"><small>{{app.eyebrow}}</small><strong>{{app.name}}</strong><span>{{app.copy}}</span><b>{{app.action}}<ArrowUpRight aria-hidden="true"/></b></span></a></div>
  </section>
</template>
