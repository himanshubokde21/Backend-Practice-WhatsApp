import multipart from "@fastify/multipart"
import { FastifyInstance } from "fastify"
import fp from "fastify-plugin"

const multipartPlugin = fp( (app: FastifyInstance) => {
    app.register(multipart)
})

export { multipartPlugin }