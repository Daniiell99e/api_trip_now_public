const jwt = require('jsonwebtoken');
const Users = require('../models/Users');
const redisCache = require('../services/RedisCacheService');

class AuthenticationController {
  
  async authenticate(req, res) {
    const { email, user_name, password } = req.body;

    const whereClause = {};
    if (email) {
      whereClause.email = email;
    } else if (user_name) {
      whereClause.user_name = user_name;
    } else {
      return res.status(401).json({ error: 'We need a e-mail or username' });
    }

    const user = await Users.findOne({
      where: whereClause,
    });

    // Validando existência do usuário e da senha num fluxo único
    // Retornamos 401 unificado contra tentativas de Enumeração de Usuários
    if (!user || !(await user.checkPassword(password))) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const { id, user_name: userName, tipo_usuario: tipoUsuario } = user;

    // --- CRIAÇÃO DOS TOKENS ---
    // Access Token (Curto)
    const token = jwt.sign(
        { userId: id, tipo_usuario: tipoUsuario }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.EXPIRE_IN }
    );

    // Refresh Token (Longo e Revogável)
    const refreshToken = jwt.sign(
        { userId: id, tipo_usuario: tipoUsuario }, 
        process.env.REFRESH_JWT_SECRET, 
        { expiresIn: process.env.REFRESH_EXPIRE_IN }
    );

    // Salva o Refresh Token no Banco de Memória Redis (TTL 7 dias)
    await redisCache.set(`refresh_token:${id}`, refreshToken, 604800);

    // Define os cookies blindados
    res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 Minutos curtos contra roubo
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias até expirar base
    });

    // Retornamos também na string JSON para clientes estritamente WebSockets ou Mobile Antigo.
    return res.status(200).json({ 
        user: { id, user_name: userName }
    });
  }

  // ROTA MESTRE: RENOVAÇÃO DO TOKEN
  async refresh(req, res) {
    // Escuta prioritariamente via cookies, ou pelo body como fallback
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token não fornecido.' });
    }

    try {
      // 1. Verifica se a chave secreta assina e não expirou
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET);
      
      // 2. Busca no Redis para garantir que o token NÃO FOI REVOGADO (Blacklist Checks)
      const storedToken = await redisCache.get(`refresh_token:${decoded.userId}`);
      
      if (!storedToken || storedToken !== refreshToken) {
        return res.status(403).json({ error: 'Sessão finalizada. Faça o login novamente.' });
      }

      // 3. Emite um novo Access Token curto recarregado
      const newToken = jwt.sign(
          { userId: decoded.userId, tipo_usuario: decoded.tipo_usuario }, 
          process.env.JWT_SECRET, 
          { expiresIn: process.env.EXPIRE_IN }
      );

      res.cookie('token', newToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000 // 15 Minutos renovados
      });

      return res.status(200).json({ token: newToken });
    } catch (err) {
      return res.status(403).json({ error: 'Refresh Token inválido ou corrompido.' });
    }
  }

  // ROTA DE LOGOUT: LIMPA COOKIES E REVOGA REFRESH TOKEN
  async logout(req, res) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      
      if (refreshToken) {
        // Tenta decodificar para descobrir o ID do usuário e remover do Redis
        try {
          const decoded = jwt.decode(refreshToken);
          if (decoded && decoded.userId) {
            await redisCache.set(`refresh_token:${decoded.userId}`, 'revogado', 1);
          }
        } catch (err) {
          console.error("Erro ao tentar revogar token no Redis durante logout:", err);
        }
      }

      // Limpa os cookies no navegador do cliente
      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      };

      res.clearCookie('token', cookieOptions);
      res.clearCookie('refreshToken', cookieOptions);

      return res.status(200).json({ message: 'Logout realizado com sucesso.' });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao realizar logout.' });
    }
  }
}

module.exports = new AuthenticationController();