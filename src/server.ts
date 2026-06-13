import app from "./app.ts"

app.get("/", async () => {
    return {msg: "hello"}
})

// ROUTERS
import { userRouter } from "./modules/user.module/user.router.ts"  
import { messageRouter } from "./modules/message.module/message.router.ts" 
import { conversationRouter } from "./modules/conversation.module/conversation.router.ts"
import { groupRouter } from "./modules/group.module/group.router.ts"

await app.register(userRouter, {
    prefix: "/api/v1/users"
})

await app.register(messageRouter, {
    prefix: "/api/v1/messages"
})

await app.register(conversationRouter, {
    prefix: "/api/v1/conversations"
})

await app.register(groupRouter, {
    prefix: "/api/v1/groups"
})

app.listen({ port: parseInt(process.env.PORT || "3000", 10) })


