import app from "./app.js";

const PORT=4000;

// start the server
app.listen(PORT,()=>{
    console.log(`Server running on http://localhost:${PORT}`)
})