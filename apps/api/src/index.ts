import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { v1Routes } from './routes/v1'
import { runStartupSync, scheduleCron } from './sync/cron'

const app = new Elysia()
  .use(cors())
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

// run sync after server starts (skip in dev with SYNC_ON_STARTUP=false)
if (process.env.SYNC_ON_STARTUP !== 'false') {
  runStartupSync().catch(console.error)
  scheduleCron()
}
