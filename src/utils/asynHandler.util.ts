import type { FastifyReply, FastifyRequest } from "fastify"

const asyncHandler = (reqHandler: Function) => {

    return async (
        req: FastifyRequest,
        rep: FastifyReply
    ) => {

        try {

            await reqHandler(req, rep)

        } catch (err) {

            rep.send(err)
        }
    }
}

export default asyncHandler