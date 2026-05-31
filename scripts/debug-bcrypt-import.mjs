import fastifyBcrypt from "fastify-bcrypt"

// #region agent log
fetch("http://127.0.0.1:7674/ingest/e30702ef-2af9-4c9b-9314-00dd061ed912", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e2ec72" },
  body: JSON.stringify({
    sessionId: "e2ec72",
    runId: "pre-fix",
    hypothesisId: "A",
    location: "scripts/debug-bcrypt-import.mjs:8",
    message: "fastify-bcrypt default export shape",
    data: {
      exportType: typeof fastifyBcrypt,
      hasHash: typeof fastifyBcrypt?.hash,
      isFunction: typeof fastifyBcrypt === "function",
      pluginName: fastifyBcrypt?.name ?? null,
    },
    timestamp: Date.now(),
  }),
}).catch(() => {})
// #endregion

const app = (await import("fastify")).default({ logger: false })
await app.register(fastifyBcrypt, { saltWorkFactor: 10 })
await app.ready()

// #region agent log
fetch("http://127.0.0.1:7674/ingest/e30702ef-2af9-4c9b-9314-00dd061ed912", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e2ec72" },
  body: JSON.stringify({
    sessionId: "e2ec72",
    runId: "pre-fix",
    hypothesisId: "C",
    location: "scripts/debug-bcrypt-import.mjs:32",
    message: "app.bcrypt after plugin register",
    data: {
      hasAppBcrypt: !!app.bcrypt,
      hasAppBcryptHash: typeof app.bcrypt?.hash,
    },
    timestamp: Date.now(),
  }),
}).catch(() => {})
// #endregion

const hashed = await app.bcrypt.hash("test-password")
// #region agent log
fetch("http://127.0.0.1:7674/ingest/e30702ef-2af9-4c9b-9314-00dd061ed912", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e2ec72" },
  body: JSON.stringify({
    sessionId: "e2ec72",
    runId: "pre-fix",
    hypothesisId: "C",
    location: "scripts/debug-bcrypt-import.mjs:48",
    message: "app.bcrypt.hash succeeded",
    data: { hashLength: hashed?.length ?? 0, startsWithBcrypt: hashed?.startsWith?.("$2") ?? false },
    timestamp: Date.now(),
  }),
}).catch(() => {})
// #endregion

await app.close()
