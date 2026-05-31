import "dotenv"
import fp from "fastify-plugin";
import jwt from "@fastify/jwt"
import type { FastifyInstance} from "fastify";


const jwtPlugin = fp(async (app: FastifyInstance) => {
    await app.register(jwt, {
        secret: process.env.JWT_SECRET!
    })
})

export { jwtPlugin }

