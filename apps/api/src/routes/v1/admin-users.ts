import { Elysia, t } from 'elysia'
import { register, getAllUsers, updateUserRole, deleteUser } from '../../services/auth.service'
import { superAdminMiddleware } from '../../middleware/auth.middleware'

export const adminUserRoutes = new Elysia({ prefix: '/admin/users' })
  .use(superAdminMiddleware)
  .get('/', async () => {
    return await getAllUsers()
  })
  .post('/', async ({ body, set }) => {
    const result = await register(body.email, body.password)
    if ('error' in result) {
      set.status = 400
      return { message: result.error }
    }
    if (body.role) {
      await updateUserRole(result.user!.id, body.role)
      result.user!.role = body.role
    }
    set.status = 201
    return result
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String(),
      role: t.Optional(t.String()),
    })
  })
  .patch('/:id', async ({ params, body, set }) => {
    const result = await updateUserRole(params.id, body.role)
    if (!result) {
      set.status = 404
      return { message: 'User not found' }
    }
    return result
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({ role: t.String() }),
  })
  .delete('/:id', async ({ params, set }) => {
    const result = await deleteUser(params.id)
    if (!result) {
      set.status = 404
      return { message: 'User not found' }
    }
    return { message: 'Deleted' }
  }, {
    params: t.Object({ id: t.String() }),
  })
