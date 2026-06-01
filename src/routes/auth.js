const { Router } = require('express');
const AuthenticationController = require('../apps/controllers/AuthenticationController');
const PasswordResetController = require('../apps/controllers/PasswordResetController');
const schemaValidator = require('../apps/middlewares/schemaValidator');
const { loginLimiter } = require('../apps/middlewares/rateLimiters');
const { authSchema } = require('../schemas/authSchema');

const authRoutes = new Router();

// Rota de Login (POST /auth/login ou apenas /auth)
authRoutes.post('/', loginLimiter, schemaValidator(authSchema), AuthenticationController.authenticate);

// Rota de Refresco (POST /auth/refresh)
authRoutes.post('/refresh', AuthenticationController.refresh);

// Rota de Logout (POST /auth/logout)
authRoutes.post('/logout', AuthenticationController.logout);

// Rotas de Recuperação de Senha
authRoutes.post('/forgot-password', PasswordResetController.requestReset);
authRoutes.post('/reset-password', PasswordResetController.resetPassword);

module.exports = authRoutes;
