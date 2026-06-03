import { Elysia, t } from 'elysia'
import {
  getAllPairings,
  getPairingById,
  createPairing,
  updatePairing
} from '../../services/pairing.service'

export const pairingRoutes = new Elysia({ prefix: '/pairings' })

  // GET /api/v1/pairings
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

  // GET /api/v1/pairings/:id
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

  // POST /api/v1/pairings — admin only (auth middleware later)
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

  // PATCH /api/v1/pairings/:id — admin only (auth middleware later)
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
