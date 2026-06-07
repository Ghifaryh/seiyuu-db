import { Elysia, t } from 'elysia'
import { register, login } from '../../services/auth.service'
import { jwtPlugin } from '../../plugins/jwt'

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(jwtPlugin)

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
  .post('/login', async ({ body, set, jwt }) => {
    const result = await login(body.email, body.password)
    if (result.error) {
      set.status = 401
      return { message: result.error }
    }

    // sign real JWT
    const token = await jwt.sign({
      id: result.user!.id,
      email: result.user!.email,
      role: result.user!.role
    })

    return { token, user: result.user }
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String()
    })
  })

  // POST /api/v1/auth/logout
  // JWT is stateless so logout is handled client-side
  // but we expose the endpoint for convention
  .post('/logout', () => {
    return { message: 'Logged out successfully' }
  })
