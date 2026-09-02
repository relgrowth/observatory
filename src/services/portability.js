import JSZip from 'jszip'
import domtoimage from 'dom-to-image-more'
import { createProject, LIMITS, uuid } from '../constants.js'
import { loadProjectBundle, saveProjectBundle } from './db.js'

const allowedMimes = new Set(['image/png','image/jpeg','image/gif','image/webp'])
const encoder = new TextEncoder()
export async function sha256(value) { const bytes = value instanceof ArrayBuffer ? value : value instanceof Blob ? await value.arrayBuffer() : encoder.encode(value); return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((x)=>x.toString(16).padStart(2,'0')).join('') }
function download(blob, name) { const url=URL.createObjectURL(blob), anchor=document.createElement('a'); anchor.href=url; anchor.download=name; anchor.click(); setTimeout(()=>URL.revokeObjectURL(url),1000) }
const safeName=(value)=>value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'observatory'

export async function exportArchive(bundle) {
  const zip=new JSZip(), clean={...bundle,media:bundle.media.map(({blob,thumbnailBlob,...meta})=>meta)}
  const files=[]
  for(const media of bundle.media){if(media.blob){const path=`media/${media.id}.${media.mime.split('/')[1]}`;zip.file(path,media.blob);files.push({path,mime:media.mime,checksum:await sha256(media.blob)})}if(media.thumbnailBlob){const path=`thumbnails/${media.id}.webp`;zip.file(path,media.thumbnailBlob);files.push({path,mime:'image/webp',checksum:await sha256(media.thumbnailBlob)})}}
  const manifest={format:'story-shack-observatory',schemaVersion:1,exportedAt:new Date().toISOString(),bundle:clean,files};zip.file('manifest.json',JSON.stringify(manifest,null,2));download(await zip.generateAsync({type:'blob',compression:'DEFLATE'}),`${safeName(bundle.project.title)}.observatory`)
}
export async function importObservatory(file) {
  const zip=await JSZip.loadAsync(file), entry=zip.file('manifest.json');if(!entry)throw new Error('This archive has no manifest.')
  const manifest=JSON.parse(await entry.async('text'));if(manifest.format!=='story-shack-observatory'||manifest.schemaVersion!==1)throw new Error('This Observatory archive version is not supported.')
  const source=manifest.bundle;if(!source?.project||source.cards?.length>LIMITS.cards||source.relationships?.length>LIMITS.relationships||source.groups?.length>LIMITS.groups)throw new Error('The archive exceeds Observatory limits.')
  const project=createProject({title:source.project.title,premise:source.project.premise}), cardIds=Object.fromEntries(source.cards.map(x=>[x.id,uuid()])), media=[]
  for(const declared of manifest.files||[]){const item=zip.file(declared.path);if(!item||!allowedMimes.has(declared.mime))throw new Error('The archive contains an invalid media file.');const blob=await item.async('blob');if(blob.size>LIMITS.imageBytes||await sha256(blob)!==declared.checksum)throw new Error('A media checksum does not match.');const oldId=declared.path.split('/').pop().split('.')[0];let record=media.find(x=>x.oldId===oldId);if(!record){record={id:uuid(),oldId,projectId:project.id,mime:declared.mime};media.push(record)}if(declared.path.startsWith('thumbnails/'))record.thumbnailBlob=blob;else record.blob=blob}
  const mediaIds=Object.fromEntries(media.map(x=>[x.oldId,x.id]));media.forEach(x=>delete x.oldId)
  const bundle={project,cards:source.cards.map(x=>({...x,id:cardIds[x.id],projectId:project.id,imageId:mediaIds[x.imageId]||null})),relationships:source.relationships.map(x=>({...x,id:uuid(),projectId:project.id,source:cardIds[x.source],target:cardIds[x.target]})),groups:source.groups.map(x=>({...x,id:uuid(),projectId:project.id,memberIds:x.memberIds.map(id=>cardIds[id]).filter(Boolean)})),cardTypes:(source.cardTypes||[]).map(x=>({...x,id:uuid(),projectId:project.id})),media};await saveProjectBundle(bundle);return project
}
export function exportMarkdown(bundle){const lines=[`# ${bundle.project.title}`,'',bundle.project.premise||'',''];for(const type of [...new Set(bundle.cards.filter(x=>!x.deletedAt).map(x=>x.typeId))]){lines.push(`## ${type[0].toUpperCase()+type.slice(1)}`,'');const cards=bundle.cards.filter(x=>!x.deletedAt&&x.typeId===type).sort((a,b)=>type==='beat'?Number(a.fields.sequence||0)-Number(b.fields.sequence||0):a.title.localeCompare(b.title));for(const card of cards){lines.push(`### ${card.title}`,'',card.body||'');for(const [key,value] of Object.entries(card.fields||{}))if(value)lines.push(`- **${key}:** ${value}`);if(card.tags?.length)lines.push(`- **Tags:** ${card.tags.join(', ')}`);lines.push('')}}download(new Blob([lines.join('\n')],{type:'text/markdown'}),`${safeName(bundle.project.title)}.md`)}
export async function exportPng(element,bundle){download(await domtoimage.toBlob(element,{bgcolor:getComputedStyle(document.body).backgroundColor}),`${safeName(bundle.project.title)}.png`)}
