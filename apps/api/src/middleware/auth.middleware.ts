import { Elysia } from 'elysia'
import { jwtPlugin } from '../plugins/jwt'

export const authMiddleware = new Elysia({ name: 'auth-middleware' })
  .use(jwtPlugin)
  .derive(async ({ jwt, headers, set }) => {
    const authorization = headers['authorization']

    if (!authorization) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    const token = authorization.replace('Bearer ', '')
    const payload = await jwt.verify(token)

    if (!payload) {
      set.status = 401
      throw new Error('Invalid token')
    }

    return {
      user: {
        id: payload.id as string,
        email: payload.email as string,
        role: payload.role as string
      }
    }
  })

export const adminMiddleware = new Elysia({ name: 'admin-middleware' })
  .use(jwtPlugin)
  .derive(async ({ jwt, headers, set }) => {
    const authorization = headers['authorization']

    if (!authorization) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    const token = authorization.replace('Bearer ', '')
    const payload = await jwt.verify(token)

    if (!payload) {
      set.status = 401
      throw new Error('Invalid token')
    }

    if ((payload.role as string) !== 'admin' && (payload.role as string) !== 'superadmin') {
      set.status = 403
      throw new Error('Forbidden')
    }

    return {
      user: {
        id: payload.id as string,
        email: payload.email as string,
        role: payload.role as string
      }
    }
  })

export const superAdminMiddleware = new Elysia({ name: 'superadmin-middleware' })
  .use(jwtPlugin)
  .derive(async ({ jwt, headers, set }) => {
    const authorization = headers['authorization']

    if (!authorization) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    const token = authorization.replace('Bearer ', '')
    const payload = await jwt.verify(token)

    if (!payload) {
      set.status = 401
      throw new Error('Invalid token')
    }

    if ((payload.role as string) !== 'superadmin') {
      set.status = 403
      throw new Error('Forbidden')
    }

    return {
      user: {
        id: payload.id as string,
        email: payload.email as string,
        role: payload.role as string
      }
    }
  })
