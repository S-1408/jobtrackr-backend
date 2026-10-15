declare global{
    namespace Express{
        // number to match User.id — requireAuth converts the JWT's string sub
        interface Request{user?:{id:number}}
    }
}
export{};
