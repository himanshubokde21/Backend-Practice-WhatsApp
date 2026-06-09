import { FastifyInstance } from "fastify"
import verifyAuth from "../../middlewares/verifyAuth.middleware"
import { deleteMessage, editMessage, forwardMessage, replyMessage, seeMessages, sendMessage } from "./message.controller"

async function messageRouter(app: FastifyInstance) {
    app.post(
        "/send",
        { preHandler: verifyAuth},
        sendMessage
    )

    app.post(
        "/delete",
        { preHandler: verifyAuth },
        deleteMessage
    )

    app.post(
        "/see",
        { preHandler: verifyAuth },
        seeMessages
    )

    app.post(
        "/edi",
        { preHandler: verifyAuth },
        editMessage
    )

    app.post(
        "/reply",
        { preHandler: verifyAuth },
        replyMessage
    )

    app.post(
        "/forward",
        { preHandler: verifyAuth },
        forwardMessage
    )
}

export { messageRouter }