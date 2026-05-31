import fp from "fastify-plugin"
import cookie from "@fastify/cookie"
import type { FastifyInstance } from "fastify"

const cookiePlugin = fp(async (app: FastifyInstance) => {
    await app.register(cookie)
})

export { cookiePlugin }