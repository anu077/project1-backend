import {Request,Response} from 'express'
import Product from '../database/models/Product'
import { AuthRequest } from '../middleware/authMiddleware'
import User from '../database/models/User'
import Category from '../database/models/Category'
import path from 'path'

class ProductController{
    async addProduct(req:AuthRequest,res:Response):Promise<void>{
        try {
           
            const userId = req.user?.id
            const {productName,productDescription,productTotalStockQty,productPrice,categoryId, productImage} = req.body 
            let productImageUrl
            if(productImage){
                // Serve the file from /Uploads as in app.ts
                productImageUrl = `/Uploads/${productImage.filename}`
            }else{
                productImageUrl = "https://aqualogica.in/cdn/shop/files/Pink_Sorbet_Plump__Lip_balm.jpg?v=1722338000&width=416"
            }
            if(!productName || !productDescription || !productTotalStockQty || !productPrice || !categoryId ){
               
                res.status(400).json({
                    message : "Please provide productName, productDescription, productTotalStockQty, productPrice, categoryId"
                })
                return
            }
            await Product.create({
                productName,
                productDescription,
                productPrice,
                productTotalStockQty,
                productImageUrl,
                userId : userId,
                categoryId : categoryId,
            })
            res.status(200).json({
                message : "Product added successfully"
            })
        } catch (err: any) {
            res.status(500).json({
                message: "Failed to add product",
                error: err.message
            })
        }
    }
    async getAllProducts(req:Request,res:Response):Promise<void>{
        const data = await Product.findAll(
            {
                include : [
                    {
                        model : User,
                        attributes : ['id','email','username']
                    },
                    {
                        model : Category,
                        attributes : ['id','categoryName']
                    }
                ]
            }
        )
        res.status(200).json({
            message : "Products fetched successfully",
            data 
        })
    }
    async getSingleProduct(req:Request,res:Response):Promise<void>{
     const id = req.params.id 
     const data = await Product.findOne({
        where : {
            id : id
        },
        include : [
            {
                model : User,
                attributes : ['id','email','username']
            },
            {
                model : Category,
                attributes : ['id','categoryName']
            }
        ]
     })
     if(!data ){
        res.status(404).json({
            message : "No product with that id"
        })
     }else{
        res.status(200).json({
            message : "Product fetched successfully",
            data
        })
    }
    }

    async deleteProduct(req:Request,res:Response):Promise<void>{
        const {id} = req.params
        const data = await Product.findAll({
            where : {
                id : id
            }
         })
         if(data.length > 0  ) {
           await Product.destroy({
                where : {
                    id : id
                }
            }) 
            
            res.status(200).json({
                message : "Product deleted successfully"
            })
            console.log(res)
         }else{
            res.status(404).json({
                message : "No product with that id"
            })
         }
       
    }
}

export default new ProductController()