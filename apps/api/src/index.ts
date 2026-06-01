import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { v1Routes } from './routes/v1'

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
