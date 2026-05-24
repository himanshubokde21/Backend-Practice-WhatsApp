import { FastifyRequest, FastifyReply } from "fastify"

const asyncHandler = async (reqHandler: Function) => {
    return (req: FastifyRequest, rep: FastifyReply, next: (err: Error) => void) => {
        Promise.resolve(reqHandler).catch((err) => next(err))
    }
}

export default asyncHandler