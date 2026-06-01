const { Router } = require('express');
const UserController = require('../apps/controllers/UserController');

// 1. Importando os seus "seguranças" que já estão prontos
const authMiddleware = require('../apps/middlewares/authentication');
const authorizeRoles = require('../apps/middlewares/authorizeRoles');

const adminRoutes = new Router();

// ------------------------------------------------------------------
// MIDDLEWARES DE ADMINISTRAÇÃO (A BLINDAGEM IMPENETRÁVEL)
// ------------------------------------------------------------------
// Passo A: O usuário precisa estar logado (ter um token válido)
adminRoutes.use(authMiddleware);

// Passo B: O segurança VIP olha a lista. Só passa quem tiver a tag 'admin'
adminRoutes.use(authorizeRoles(['admin']));

// ------------------------------------------------------------------
// ROTAS EXCLUSIVAS DO PAINEL ADMIN
// ------------------------------------------------------------------

// Qualquer rota colocada aqui embaixo agora está 100% protegida!
adminRoutes.post('/users', UserController.create); 
adminRoutes.delete('/users/:id', UserController.deleteUser); 

//  Buscar estatísticas do Dashboard
// adminRoutes.get('/stats', UserController.getDashboardStats);

module.exports = adminRoutes;