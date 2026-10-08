import app from "./app.js";
import { env } from "./config/env.js";

const PORT=env.port;

// start the server
app.listen(PORT,()=>{
    console.log(`Server running on http://localhost:${PORT}`)
})