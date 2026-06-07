import { Elysia, t } from 'elysia'
import {
  getAllPairings,
  getPairingById,
  createPairing,
  updatePairing
} from '../../services/pairing.service'
import { adminMiddleware } from '../../middleware/auth.middleware'

// public routes
const publicPairingRoutes = new Elysia({ prefix: '/pairings' })
  .get('/', async ({ query }) => {
    const page = Number(query.page ?? 1)
    const limit = Number(query.limit ?? 24)
    return await getAllPairings(page, limit)
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String())
    })
  })
  .get('/:id', async ({ params, set }) => {
    const result = await getPairingById(params.id)
    if (!result) {
      set.status = 404
      return { message: 'Pairing not found' }
    }
    return result
  }, {
    params: t.Object({ id: t.String() })
  })

// admin routes
const adminPairingRoutes = new Elysia({ prefix: '/pairings' })
  .use(adminMiddleware)
  .post('/', async ({ body, set }) => {
    const result = await createPairing(body)
    set.status = 201
    return result
  }, {
    body: t.Object({
      seiyuuAId: t.String(),
      seiyuuBId: t.String(),
      pairName: t.Optional(t.String()),
      description: t.Optional(t.String())
    })
  })
  .patch('/:id', async ({ params, body, set }) => {
    const result = await updatePairing(params.id, body)
    if (!result) {
      set.status = 404
      return { message: 'Pairing not found' }
    }
    return result
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({
      pairName: t.Optional(t.String()),
      description: t.Optional(t.String())
    })
  })

// export both together
export const pairingRoutes = new Elysia()
  .use(publicPairingRoutes)
  .use(adminPairingRoutes)
