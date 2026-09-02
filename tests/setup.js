import 'fake-indexeddb/auto'
import { vi } from 'vitest'
globalThis.matchMedia=vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}))
