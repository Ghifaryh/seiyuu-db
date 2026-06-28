import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { v1Routes } from './routes/v1'
import { runStartupSync, scheduleCron } from './sync/cron'
import { setupMeiliIndexes } from './lib/meili'

const app = new Elysia()
  .use(cors({
    origin: [
      'http://localhost:4321',
      'http://localhost:4322',
      'https://seiyuu-db.gehu.me',
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  }))
  .use(swagger({
    documentation: {
      info: {
        title: 'seiyuu.db API',
        version: '1.0.0'
      }
    }
  }))
  .get('/', () => ({ message: 'seiyuu.db API is running' }))
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .group('/api', app => app
    .use(v1Routes)
  )
  .listen(3001)

console.log(`API running at ${app.server?.hostname}:${app.server?.port}`)

// always setup MeiliSearch indexes on startup
setupMeiliIndexes().catch(console.error)

// run sync after server starts (skip with SYNC_ON_STARTUP=false)
if (process.env.SYNC_ON_STARTUP !== 'false') {
  runStartupSync().catch(console.error)
  scheduleCron()
}

scheduleCron()
