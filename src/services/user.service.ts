export interface User{
    id:number;
    email:string;
    name:string;
    passwordHash:string
}
export type PublicUser = Omit<User,"passwordHash">

const users: User[]=[
    {
    id:1,
    email:'sonam@gmail.com',
    name:"Sonam Verma",
    // passwordHash:'$2b$10$XAuV0QFPaRQQBuTuGB04tOHZ71Ko6iSTpF.4QO7Bm.18SAga8pZP2'
    passwordHash:'$2b$10$LdkBEeP0sfgEpFT6NP/rOeSWUscwIVix6mYNkWflFrM3YIlTXCcHO'
    }
]

export function findByEmail(email:string){
   return users.find((user)=>user.email.toLowerCase() === email.toLowerCase())
}
export function findById(id:number){
  return users.find(user=>user.id===id)
}
export function toPublicUser(user:User):PublicUser{
  const {passwordHash,...publicUser} = user;
  return publicUser
}
