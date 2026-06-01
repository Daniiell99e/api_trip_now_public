const Users = require('../models/Users');
const { sendPasswordResetEmail } = require('../services/email');

// Armazenamento temporário dos códigos de redefinição de senha
const resetCodes = {};

class PasswordResetController {

  // POST /auth/forgot-password
  // Recebe o e-mail, gera um código e envia por e-mail
  async requestReset(req, res) {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'E-mail é obrigatório.' });
    }

    try {
      const user = await Users.findOne({ where: { email } });

      // Retornamos sempre 200 para não revelar se o e-mail existe no sistema (anti-enumeração)
      if (!user) {
        return res.status(200).json({ message: 'Se este e-mail estiver cadastrado, você receberá um código em breve.' });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();

      resetCodes[email] = {
        code,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutos
      };

      await sendPasswordResetEmail(email, code);

      return res.status(200).json({ message: 'Se este e-mail estiver cadastrado, você receberá um código em breve.' });

    } catch (error) {
      console.error('Erro ao solicitar redefinição de senha:', error);
      return res.status(500).json({ message: 'Erro interno ao processar a solicitação.' });
    }
  }

  // POST /auth/reset-password
  // Recebe e-mail, código e nova senha — valida e atualiza
  async resetPassword(req, res) {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'E-mail, código e nova senha são obrigatórios.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    const storedData = resetCodes[email];

    if (!storedData) {
      return res.status(400).json({ message: 'Nenhuma solicitação de redefinição encontrada para este e-mail.' });
    }

    if (storedData.expiresAt < Date.now()) {
      delete resetCodes[email];
      return res.status(400).json({ message: 'Código de verificação expirado. Por favor, solicite um novo.' });
    }

    if (storedData.code !== code) {
      return res.status(400).json({ message: 'Código de verificação inválido.' });
    }

    try {
      const user = await Users.findOne({ where: { email } });

      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }

      // Usa o campo virtual 'password' para acionar o hook beforeSave que gera o hash
      user.password = newPassword;
      await user.save();

      delete resetCodes[email];

      return res.status(200).json({ message: 'Senha redefinida com sucesso! Você já pode fazer o login.' });

    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      return res.status(500).json({ message: 'Erro interno ao redefinir a senha.' });
    }
  }
}

module.exports = new PasswordResetController();
