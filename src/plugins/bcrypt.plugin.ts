import type { FastifyInstance } from "fastify";
import fastifyBcrypt from "fastify-bcrypt";
import fp from "fastify-plugin"

const bcryptPlugin = fp( async (app: FastifyInstance) => {
    await app.register(fastifyBcrypt, { 
        saltWorkFactor: Number(process.env.BCRYPT_SALT_WORK_FACTOR!)
    })
})

export {bcryptPlugin}