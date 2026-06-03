import { Elysia, t } from 'elysia'
import { getNews, createNewsPost, deleteNewsPost } from '../../services/news.service'

export const newsRoutes = new Elysia({ prefix: '/news' })

  // GET /api/v1/news
  .get('/', async ({ query }) => {
    const limit = Number(query.limit ?? 20)
    return await getNews(query.category, limit)
  }, {
    query: t.Object({
      category: t.Optional(t.String()),
      limit: t.Optional(t.String())
    })
  })

  // POST /api/v1/news — admin only (auth middleware later)
  .post('/', async ({ body, set }) => {
    const result = await createNewsPost(body)
    set.status = 201
    return result
  }, {
    body: t.Object({
      title: t.String(),
      body: t.String(),
      category: t.Optional(t.String()),
      seiyuuId: t.Optional(t.String()),
      createdBy: t.String()
    })
  })

  // DELETE /api/v1/news/:id — admin only (auth middleware later)
  .delete('/:id', async ({ params, set }) => {
    const result = await deleteNewsPost(params.id)
    if (!result) {
      set.status = 404
      return { message: 'News post not found' }
    }
    return { message: 'Deleted successfully' }
  }, {
    params: t.Object({ id: t.String() })
  })
