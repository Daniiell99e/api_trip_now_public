const Users = require('../models/Users');
const db = require('../../database');

class UserController {

  // --- 3. CRIAR USUÁRIO DIRETO (Admin ou Legado) ---
  async create(req, res) {
    const { name, user_name, email, password, tipo_usuario } = req.body;
    
    const verifyUser = await Users.findOne({ where: { email: email } });
    if (verifyUser) return res.status(400).send({ message: 'User already exists' });

    try {
      const user = await Users.create({
        name, user_name, email, password, tipo_usuario,
        esta_ativo: true,
        id_assinatura: 1
      });
      return res.status(201).send({ message: 'User created' });
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao criar usuário.' });
    }
  }

  // --- 4. BUSCAR PERFIL DO USUÁRIO LOGADO ---
  async getProfile(req, res) {
    try {
      const { userId } = req;

      if (!userId) {
        return res.status(401).json({ message: 'Token inválido.' });
      }

      const user = await Users.findByPk(userId, {
        attributes: { exclude: ['password', 'password_hash'] }
      });

      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }

      let nomeCidade = user.cidade;
      let nomePais = user.pais;

      const userProfile = {
        id: user.id,
        name: user.name,
        user_name: user.user_name,
        email: user.email,
        telefone: user.telefone,
        data_nascimento: user.data_nascimento,
        cidade: nomeCidade, 
        pais: nomePais,
        biografia: user.biografia,
        rede_social: user.rede_social,
        url_foto_perfil: user.url_foto_perfil
      };

      return res.status(200).json(userProfile);

    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return res.status(500).json({ message: 'Falha ao buscar perfil.' });
    }
  }

  // --- 5. ATUALIZAR USUÁRIO (PUT) ---
  async updateUser(req, res) {
    try {
      const { id } = req.params; 

      if (parseInt(id) !== req.userId && req.tipoUsuario !== 'admin') {
        return res.status(403).json({ error: 'Sem permissão para modificar este usuário.' });
      }

      // Recebe todos os campos possíveis
      const { 
        user_name, email, password, name, 
        biografia, rede_social, telefone, 
        data_nascimento, cidade, pais, url_foto_perfil 
      } = req.body;

      const user = await Users.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado!' });
      }

      // Atualiza apenas o que foi enviado
      if (user_name) user.user_name = user_name;
      if (email) user.email = email;
      if (name) user.name = name;
      if (biografia) user.biografia = biografia;
      if (rede_social) user.rede_social = rede_social;
      if (telefone) user.telefone = telefone;
      if (data_nascimento) user.data_nascimento = data_nascimento;
      if (cidade) user.cidade = cidade; // Salva string direto
      if (pais) user.pais = pais;       // Salva string direto
      // -- if (url_foto_perfil) user.url_foto_perfil = url_foto_perfil;
      
      if (password) user.password = password; // Hook fará o hash

      await user.save();

      return res.status(200).json({ message: 'Usuário atualizado com sucesso!' });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
  }

  // ---  . ATUALIZAR FOTO DE PERFIL (PATCH) ---
  async updateProfileImage(req, res) {
    try {
      // 1. O ID do usuário vem do middleware de autenticação (AuthenticateMiddleware)
      const { userId } = req; 

      // 2. Verifica se o arquivo foi processado pelo Multer/Cloudinary
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhuma imagem foi enviada.' });
      }

      // 3. Busca o usuário no banco
      const user = await Users.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }

      // 4. Salva a URL gerada pelo Cloudinary (que está em req.file.path)
      const imageUrl = req.file.path;
      user.url_foto_perfil = imageUrl;
      await user.save();

      return res.status(200).json({
        message: 'Foto de perfil atualizada com sucesso!',
        url: imageUrl
      });

    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
      return res.status(500).json({ message: 'Falha ao processar upload da imagem.' });
    }
  }

  // --- 6. DELETAR USUÁRIO ---
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      if (parseInt(id) !== req.userId && req.tipoUsuario !== 'admin') {
        return res.status(403).json({ error: 'Sem permissão para deletar este usuário.' });
      }

      const user = await Users.findByPk(id);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado!' });
      
      await user.destroy();
      return res.status(200).json({ message: 'Usuário deletado com sucesso!' });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao deletar usuário.' });
    }
  }

}

module.exports = new UserController();