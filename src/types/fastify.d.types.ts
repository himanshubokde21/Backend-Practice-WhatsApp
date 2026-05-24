declare module "fastify"{
    interface FastifyRequest {
        user: {
            id: string
        },
    }

    interface FastifyInstance {
        verifyAuth: (
            req: FastifyRequest, 
            rep: FastifyReply
        ) => Promise<void>

        generateAccessToken: (
            payload: { [fieldname: string ]: string | number}
        ) => Promise<string>

        generateRefreshToken: (
            payload: { [fieldname: string]: string}
        ) => Promise<string>

        uploadOnCloudinary: (
            filepath: string
        ) => Promise<{
                public_id: string,
                url: string
            }>

        deleteFromCloudinary: (
            id: string
        ) => Promise<{
            [result: string]: string
        }>
    }
}