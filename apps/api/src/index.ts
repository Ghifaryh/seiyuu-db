import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'

const app = new Elysia()
  .use(cors())
  .use(swagger({
    documentation: {
      info: {
        title: 'seiyuu.db API',
        version: '0.0.1'
      }
    }
  }))
  .get('/', () => ({ message: 'seiyuu.db API is running' }))
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .listen(3001)

console.log(`API running at ${app.server?.hostname}:${app.server?.port}`)
