import app from "./app.ts"

app.get("/", async () => {
    return {msg: "hello"}
})

app.listen({ port: parseInt(process.env.PORT || "3000", 10) })


