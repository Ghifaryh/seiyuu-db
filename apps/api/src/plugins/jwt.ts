import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'

const secret = process.env.JWT_SECRET
if (!secret) throw new Error('JWT_SECRET environment variable is required')

export const jwtPlugin = new Elysia({ name: 'jwt' })
  .use(
    jwt({
      name: 'jwt',
      secret,
      exp: '7d'
    })
  )
