import { ref } from 'vue'
export const webMcpActivity = ref({ visible: false, status: 'idle', title: '', message: '' })
export function showWebMcpActivity(status, title, message, timeout = 3500) { webMcpActivity.value = { visible: true, status, title, message }; if (timeout) setTimeout(() => { if (webMcpActivity.value.title === title) webMcpActivity.value.visible = false }, timeout) }
