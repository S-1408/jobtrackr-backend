import express from 'express'
const router = express.Router()
// In-memory database
let applications = [
  {
    id: 1,
    company: "Google",
    role: "Frontend Developer",
    status: "applied",
    appliedAt:"2026-09-30T10:30:00.000Z",
  },
];

let nextId = 2;

// get all application
router.get('/',(req,res)=>{
    res.
    status(200).
    json({
        message:"success",
        data:applications
    })
})

// send application by id

router.get('/:id',(req,res)=>{
  let id = Number(req.params.id)
  const application = applications.find(a=>a.id===id);
  // check edge if requested application is not present in database
  if(!application){
   return res.status(404).json({message:"Application not found"})
  }
  res.json(application)
})

// create application
router.post("/",(req,res)=>{
    const {company,role,status} = req.body;

    if(!company || !role){
        return res.status(400).json({message: 'company and role are required'})
    }
    const newApplication ={id:nextId++,company,role,status:status || 'applied',appliedAt: new Date().toISOString()}
    applications.push(newApplication);
    res.status(201).json(newApplication)
})

// update the request application by id
router.put('/:id',(req,res)=>{
    const id = Number(req.params.id);
    const index = applications.findIndex(a=>a.id ===id)
    if(index === -1){
        return res.status(404).json({message:"Application not found"})
    }
    applications[index] = {...applications[index],...req.body,id}
    res.json(applications[index])
})

// delete the application
router.delete('/:id',(req,res)=>{
    const id = Number(req.params.id)
    const exist = applications.some(a=>a.id ===id)
    if(!exist){
        return res.status(404).json({message:"Application not found"})
    }
   applications = applications.filter(a=>a.id !==id)

    res.status(204).send()
})
export default router