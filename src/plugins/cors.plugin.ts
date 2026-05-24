import cors from "@fastify/cors"
import fp from "fastify-plugin"
import { FastifyInstance } from "fastify"

const corsPlugin = fp(async (app: FastifyInstance) => {
    app.register(cors, {
        origin: true,
        credentials: true
    })
})

export { corsPlugin }