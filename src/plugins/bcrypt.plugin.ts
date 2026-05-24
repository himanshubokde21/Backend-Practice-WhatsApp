import { FastifyInstance } from "fastify";
import fastifyBcrypt from "fastify-bcrypt";
import fp from "fastify-plugin"

const bcryptPlugin = fp( async (app: FastifyInstance) => {
    app.Register(fastifyBcrypt)
})

export {bcryptPlugin}