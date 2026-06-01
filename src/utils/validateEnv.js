const { z } = require('zod');
const logger = require('./logger');

// Definição do schema rigoroso para as variáveis de ambiente
const envSchema = z.object({
  PORT: z.string().default('3333'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Banco de Dados
  DIALECT: z.string(),
  HOST: z.string(),
  DB_USERNAME: z.string(),
  PASSWORD: z.string(),
  DATABASE: z.string(),
  DB_PORT: z.string(),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres para segurança.'),
  EXPIRE_IN: z.string(),
  REFRESH_JWT_SECRET: z.string().min(32, 'REFRESH_JWT_SECRET deve ter no mínimo 32 caracteres.'),
  REFRESH_EXPIRE_IN: z.string(),
  
  // Outros Secrets
  SECRET_CRYPTO: z.string().min(16)
});

/**
 * Valida as variáveis de ambiente na inicialização da aplicação.
 * Se estiverem inválidas ou faltando, encerra o processo imediatamente (Fail Fast).
 */
const validateEnv = () => {
  try {
    const parsedEnv = envSchema.parse(process.env);
    
    // Podemos anexar as variáveis validadas de volta ao process.env ou exportá-las
    // process.env = { ...process.env, ...parsedEnv };
    
    console.log('✅ Variáveis de ambiente validadas e seguras.');
    return parsedEnv;
  } catch (error) {
    console.error('❌ ERRO CRÍTICO DE CONFIGURAÇÃO (Variáveis de Ambiente):');
    
  if (error instanceof z.ZodError) {
  error.issues.forEach(err => {
    const field = err.path.join('.');
    console.error(`   -> ${field}: ${err.message}`);
  });
} else {
  console.error(error);
}
    // Registra no arquivo de log físico se o logger já estiver configurado
    if (logger && logger.error) {
      logger.error('Falha na inicialização: Variáveis de ambiente ausentes ou inválidas.', { details: error.errors });
    }

    console.error('🛑 A aplicação não pode iniciar sem essas configurações. Processo encerrado.');
    process.exit(1); // Encerra imediatamente com código de erro
  }
};

module.exports = validateEnv;