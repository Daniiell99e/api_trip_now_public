require('dotenv').config();
const validateEnv = require('./utils/validateEnv');
validateEnv(); // Executa a validação de ambiente (fail-fast)

require('./database/index')
const routes = require('./routes');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');


// Importa os componentes que foram movidos da pasta 'api'
const errorHandler = require('./apps/middlewares/errorHandler');
const xssSanitizer = require('./apps/middlewares/xssSanitizer');
const { globalLimiter } = require('./apps/middlewares/rateLimiters');

const app = express();

// Ativa todos os cabeçalhos de segurança padrão e configurações avançadas do ZAP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            objectSrc: ["'none'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" }
}));

// Middlewares de segurança adicionais
app.use((req, res, next) => {
    // Permissions-Policy
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
    
    // Cache-Control
    if (req.method === 'GET' && req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
    next();
});

// Ativa o log seguro de requisições web (apenas se não estiver rodando testes)
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

// Middlewares essenciais
// Configuração explícita do CORS para permitir credenciais (cookies)
// e cabeçalhos específicos da origem do seu frontend.
app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(',') || 'http://localhost:3000', // Permite requisições apenas desta origem
    credentials: true, // Permite que o navegador envie cookies
    allowedHeaders: ['Content-Type', 'Authorization'], // Permite explicitamente esses cabeçalhos
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Permite esses métodos HTTP
}));

// Middleware para interpretar os cookies enviados nas requisições
app.use(cookieParser());
// Aumentamos para 50mb para garantir que qualquer foto passe sem erro
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Proteção contra ataques de negação de serviço e sobrecargas
app.use(globalLimiter);

// Sanitiza globalmente as entradas para evitar XSS
app.use(xssSanitizer);

// Carrega todas as rotas da aplicação dentro da versão 1 da API
app.use('/api/v1', routes);

// Middleware de tratamento de erros. Deve ser o último `app.use` antes do `app.listen`.
app.use(errorHandler);


// configurações funcionais do servidor:
if (require.main === module) {
    const port = process.env.PORT || 3333;
    app.listen(port, () => {
        console.log(`👽 Servidor rodando na porta ${port}`);
    });
}

module.exports = app;
