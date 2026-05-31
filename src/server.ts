import app from "./app.ts"

app.get("/", async () => {
    return {msg: "hello"}
})

// ROUTERS
import { userRouter } from "./modules/user.module/user.router.ts"   


await app.register(userRouter, {
    prefix: "/api/v1/users"
})

app.listen({ port: parseInt(process.env.PORT || "3000", 10) })


