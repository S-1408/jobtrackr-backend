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
    email:'abc@gmail.com',
    name:"abc",
    passwordHash:'$2b$10$XAuV0QFPaRQQBuTuGB04tOHZ71Ko6iSTpF.4QO7Bm.18SAga8pZP2'
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
