const { Router } = require('express');
const UserController = require('../apps/controllers/UserController');
const UserVerificationController = require('../apps/controllers/UserVerificationController');
const AuthenticateMiddleware = require('../apps/middlewares/authentication');
const { storage } = require('../configs/cloudinary');
// cloudinary ----
const multer = require('multer'); // 1. Importa a biblioteca
const upload = multer({ storage });
const schemaValidator = require('../apps/middlewares/schemaValidator');
const { createUserSchema, updateUserSchema } = require('../schemas/userSchema');

const userRoutes = new Router();

// Rotas Públicas (Cadastro/Verificação)
userRoutes.post('/createuserverify', schemaValidator(createUserSchema), UserVerificationController.sendVerification);
userRoutes.post('/createuserverifycode', UserVerificationController.verifyAndCreateUser);

userRoutes.patch('/profile-image', AuthenticateMiddleware, upload.single('foto'), UserController.updateProfileImage);

// Rotas Protegidas (Perfil)
userRoutes.get('/profile', AuthenticateMiddleware, UserController.getProfile);
userRoutes.put('/:id', AuthenticateMiddleware, schemaValidator(updateUserSchema), UserController.updateUser);
userRoutes.delete('/:id', AuthenticateMiddleware, UserController.deleteUser);

module.exports = userRoutes;
