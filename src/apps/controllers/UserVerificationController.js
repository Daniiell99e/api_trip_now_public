const Users = require('../models/Users');
const { sendVerificationEmail } = require('../services/email');

// Armazenamento temporário de usuários não verificados
const unverifiedUsers = {};

class UserVerificationController {
    async sendVerification(req, res) {
        const { email } = req.body;

        try {
            // Verifica se o usuário já existe no banco de dados
            const verifyUser = await Users.findOne({ where: { email: email } });
            if (verifyUser) {
                return res.status(409).send({ message: 'Este e-mail já está cadastrado.' });
            }

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            
            unverifiedUsers[email] = {
                code: code,
                data: req.body,
                expiresAt: Date.now() + 10 * 60 * 1000 // Adiciona um timestamp de expiração (10 minutos)
            };
            
            await sendVerificationEmail(email, code);
            
            res.status(200).json({ message: 'Código de verificação enviado para o seu e-mail.' });

        } catch (error) {
            console.error("Erro ao enviar código de verificação:", error);
            return res.status(500).json({ message: 'Erro interno ao processar a solicitação.' });
        }
    }

    async verifyAndCreateUser(req, res) {
        const { email, code } = req.body;
        const userData = unverifiedUsers[email];

        // Verifica se o código expirou
        if (userData && userData.expiresAt < Date.now()) {
            delete unverifiedUsers[email]; // Limpa o código expirado
            return res.status(400).json({ message: 'Código de verificação expirado. Por favor, solicite um novo.' });
        }

        if (userData && userData.code === code) {
            try {
                // Lógica de criação do usuário
                const verifyUser = await Users.findOne({ where: { email: userData.data.email } });
                if (verifyUser) {
                    return res.status(409).send({ message: 'Este e-mail já está cadastrado.' });
                }
                
                const user = await Users.create({
                    name: userData.data.name,
                    user_name: userData.data.user_name,
                    email: userData.data.email,
                    password: userData.data.password,
                    tipo_usuario: 'usuario',
                    esta_ativo: true,
                    id_assinatura: 1
                });
                if (!user) {
                    return res.status(400).send({ message: 'Failed to create user' });
                }
                
                delete unverifiedUsers[email];
                return res.status(201).send({ message: 'Usuário criado com sucesso!' });

            } catch (error) {
                console.error("Erro ao criar usuário após verificação:", error);
                res.status(500).json({ message: 'Erro ao criar usuário.' });
            }
        } else {
            res.status(400).json({ message: 'Código de verificação inválido.' });
        }
    }
}

module.exports = new UserVerificationController();
