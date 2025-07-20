import express, { Router, Request, Response, NextFunction } from 'express'
import authMiddleware, { Role } from '../middleware/authMiddleware'
import productController from '../controllers/productController'
import upload from '../middleware/multerMiddleware'

const router: Router = express.Router()

// Custom middleware to accept either 'image' or 'productImage' as the file field
function flexibleSingleFile(req: Request, res: Response, next: NextFunction) {
  // Try to handle both field names
  const imageField = (req as any).files?.image || (req as any).files?.productImage;
  if (imageField) {
    (req as any).file = Array.isArray(imageField) ? imageField[0] : imageField;
  }
  next();
}

router.route("/")
.post(
  authMiddleware.isAuthenticated,
  authMiddleware.restrictTo(Role.Admin, Role.Customer),
  // Accept either 'image' or 'productImage' as the file field
  (req: Request, res: Response, next: NextFunction) => {
  
    upload.single('productImage')(req, res, function (err) {
      if (err && (err as any).code === 'LIMIT_UNEXPECTED_FILE') {
        // Try 'productImage' if 'image' fails
        return upload.single('productImage')(req, res, next);
      }
      next(err);
    });
  },
  productController.addProduct
)
.get(productController.getAllProducts)

router.route("/:id").get(productController.getSingleProduct)
.delete(authMiddleware.isAuthenticated, authMiddleware.restrictTo(Role.Admin), productController.deleteProduct)

export default router 