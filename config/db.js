// db.js
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/yakalma', {
      // Les options suivantes ne sont plus nécessaires dans les versions récentes de Mongoose
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log('Connecté à MongoDB');
  } catch (err) {
    console.error('Erreur de connexion à MongoDB :', err);
    process.exit(1); // Arrête le processus si la connexion échoue
  }
};

module.exports = connectDB;
