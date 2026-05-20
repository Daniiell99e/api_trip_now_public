require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configuração com as variáveis do seu .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tripnow_profiles', // Nome da pasta que aparecerá no Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'heic', 'heif'],
    format: 'webp',
    transformation: [{ width: 500, height: 500, crop: 'fill' }] // Ajusta o tamanho automaticamente
  },
});

module.exports = { cloudinary, storage };