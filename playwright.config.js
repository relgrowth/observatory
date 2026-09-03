import { defineConfig } from '@playwright/test'
export default defineConfig({testDir:'./tests/e2e',use:{baseURL:'http://127.0.0.1:5190',trace:'retain-on-failure'},webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5190',url:'http://127.0.0.1:5190',reuseExistingServer:false}})
