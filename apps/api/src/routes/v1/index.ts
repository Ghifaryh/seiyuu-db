import { Elysia } from 'elysia'
import { seiyuuRoutes } from './seiyuu'
import { seasonRoutes } from './season'
import { searchRoutes } from './search'
import { pairingRoutes } from './pairing'
import { newsRoutes } from './news'
import { authRoutes } from './auth'

export const v1Routes = new Elysia({ prefix: '/v1' })
  .use(seiyuuRoutes)
  .use(seasonRoutes)
  .use(searchRoutes)
  .use(pairingRoutes)
  .use(newsRoutes)
  .use(authRoutes)
