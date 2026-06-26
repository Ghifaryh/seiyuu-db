import { Elysia } from 'elysia'
import { seiyuuRoutes, adminSeiyuuRoutes } from './seiyuu'
import { seasonRoutes } from './season'
import { searchRoutes } from './search'
import { pairingRoutes } from './pairing'
import { newsRoutes } from './news'
import { authRoutes } from './auth'
import { syncRoutes } from './sync'
import { animeRoutes } from './anime'

export const v1Routes = new Elysia({ prefix: '/v1' })
  .use(seiyuuRoutes)
  .use(adminSeiyuuRoutes)
  .use(seasonRoutes)
  .use(searchRoutes)
  .use(pairingRoutes)
  .use(newsRoutes)
  .use(authRoutes)
  .use(syncRoutes)
  .use(animeRoutes)
