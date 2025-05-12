const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Importation des routes
const authRoute = require('./routes/authRoute');  // Importation des routes d'authentification
const clientRoutes = require('./routes/clientRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const livreurRoutes = require('./routes/livreurRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Connexion à MongoDB
const DB_URI = 'mongodb://localhost:27017/yakalma'; // Remplacez par votre configuration
mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connecté à MongoDB'))
  .catch((err) => console.error('Erreur de connexion à MongoDB :', err));

// Initialisation de l'application Express
const app = express();

// Configuration de CORS
app.use(cors({
  origin: 'http://localhost:4200', // URL de l'application Angular
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware pour parser les requêtes JSON
app.use(bodyParser.json());

// Utilisation des routes
app.use('/api/auth/', authRoute);
app.use('/api/clients', clientRoutes);         // Routes pour les clients
app.use('/api/restaurants', restaurantRoutes); // Routes pour les restaurants
app.use('/api/livreurs', livreurRoutes);    // Routes pour les livreurs
app.use('/api/admins', adminRoutes);           // Routes pour les administrateurs

// Lancer le serveur
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
