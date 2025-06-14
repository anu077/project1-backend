import User from "./database/models/User"
import bcrypt from 'bcrypt'

const adminSeeder = async():Promise<void> =>{
 try {
    const [data] = await User.findAll({
        where : {
            email : "hi@gmail.com",

        }
    })
    if(!data){
        await User.create({
            email : "hi@gmail.com",
            password : bcrypt.hashSync("metoo",8),
            username : "hello",
            role : 'admin'
        })
        console.log("admin credentials seeded successfully")
    }else{
        console.log("admin credentials already seeded")
    }
 } catch (error:any) {
    console.log(error.message)
 }
}

export default adminSeeder