
const { Router } = require('express');
const RoteiroController = require('../apps/controllers/RoteiroController');
const ExternalApiController = require('../apps/controllers/ExternalApiController');
const AtracaoSugestaoController = require('../apps/controllers/AtracaoSugestaoController');
const roteiroAtracaoController = require('../apps/controllers/RoteiroAtracaoController');
const AuthenticateMiddleware = require('../apps/middlewares/authentication');
const schemaValidator = require('../apps/middlewares/schemaValidator');
const { createRoteiroSchema } = require('../schemas/roteiroSchema');

const { storage } = require('../configs/cloudinary'); // Pega o storage que existe
const multer = require('multer'); // Importa o multer

// --- CONFIGURAÇÃO DE SEGURANÇA DO UPLOAD ---
const upload = multer({ 
    storage,
    // 1. Filtro para aceitar apenas imagens
    fileFilter: (req, file, cb) => {
        const formatosAceitos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif'];
        
        if (formatosAceitos.includes(file.mimetype)) {
            cb(null, true); // Arquivo aprovado!
        } else {
            cb(new Error('Formato inválido! Envie apenas imagens (JPG, PNG ou WEBP).'), false); // Bloqueia o arquivo
        }
    },
    // 2. Limite de tamanho (10MB) para não lotar o Cloudinary
    limits: {
        fileSize: 10 * 1024 * 1024 
    }
});


const roteiroRoutes = new Router();

// Aplicando o middleware em todas as rotas deste arquivo (todas são protegidas)
roteiroRoutes.use(AuthenticateMiddleware);

// --- 1. ROTAS ESTÁTICAS (NOMES FIXOS) - DEVEM VIR PRIMEIRO ---
roteiroRoutes.get('/curated-cities', RoteiroController.getCuratedCities);
roteiroRoutes.get('/search', RoteiroController.searchCity);
roteiroRoutes.post('/import', ExternalApiController.importRoteiro);

// CRUD de Roteiros
roteiroRoutes.post('/', schemaValidator(createRoteiroSchema), RoteiroController.create);
roteiroRoutes.get('/', RoteiroController.getAll);
roteiroRoutes.put('/:roteiroId', RoteiroController.update);
roteiroRoutes.delete('/:roteiroId', RoteiroController.delete);
roteiroRoutes.get('/:roteiroId', RoteiroController.getById);
roteiroRoutes.post('/import', ExternalApiController.importRoteiro);

// Atrações vinculadas
roteiroRoutes.post('/:roteiroId/atracoes', roteiroAtracaoController.create);
roteiroRoutes.get('/:roteiroId/sugestoes-atracoes', AtracaoSugestaoController.getSugestoes);
roteiroRoutes.patch('/atividades/:id/fotos', upload.single('foto'), roteiroAtracaoController.uploadFoto);
roteiroRoutes.delete('/atividades/:id/fotos', roteiroAtracaoController.removerFoto);

module.exports = roteiroRoutes;