import { Elysia, t } from 'elysia'
import { register, login } from '../../services/auth.service'

export const authRoutes = new Elysia({ prefix: '/auth' })

  // POST /api/v1/auth/register
  .post('/register', async ({ body, set }) => {
    const result = await register(body.email, body.password)
    if (result.error) {
      set.status = 400
      return { message: result.error }
    }
    set.status = 201
    return result
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String()
    })
  })

  // POST /api/v1/auth/login
  .post('/login', async ({ body, set }) => {
    const result = await login(body.email, body.password)
    if (result.error) {
      set.status = 401
      return { message: result.error }
    }
    return result
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String()
    })
  })
