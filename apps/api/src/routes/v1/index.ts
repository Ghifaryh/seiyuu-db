import { Elysia } from 'elysia'
import { seiyuuRoutes } from './seiyuu'

export const v1Routes = new Elysia({ prefix: '/v1' })
  .use(seiyuuRoutes)
