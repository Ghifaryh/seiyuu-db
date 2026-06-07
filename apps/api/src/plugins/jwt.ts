import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'

export const jwtPlugin = new Elysia({ name: 'jwt' })
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET ?? 'dev_secret_change_me',
      exp: '7d'
    })
  )
