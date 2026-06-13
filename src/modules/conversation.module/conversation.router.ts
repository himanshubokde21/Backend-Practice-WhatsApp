import { FastifyInstance } from "fastify";
import verifyAuth from "../../middlewares/verifyAuth.middleware";
import { addToConversation, clearConversation, createConversation, deleteConversation, getConversationById, getConversations } from "./conversation.controller";

async function conversationRouter(app: FastifyInstance) {
    app.post(
        "/create",
        { preHandler: verifyAuth },
        createConversation
    )

    app.post(
        "/add",
        { preHandler: verifyAuth },
        addToConversation
    )

    app.post(
        "/clear",
        { preHandler: verifyAuth },
        clearConversation
    )

    app.post(
        "/delete",
        { preHandler: verifyAuth },
        deleteConversation
    )

    app.post(
        "/get",
        { preHandler: verifyAuth },
        getConversationById
    )

    app.post(
        "/get-all",
        { preHandler: verifyAuth },
        getConversations
    )
}

export { conversationRouter }