import { Elysia, t } from 'elysia'
import { getAnimeById } from '../../services/anime.service'

export const animeRoutes = new Elysia({ prefix: '/anime' })
  .get('/:id', async ({ params, set }) => {
    const result = await getAnimeById(params.id)
    if (!result) {
      set.status = 404
      return { message: 'Anime not found' }
    }
    return result
  }, {
    params: t.Object({ id: t.String() })
  })
