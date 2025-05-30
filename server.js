const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./config/db"); // Importe la fonction de connexion à la base de données

// Importation des routes
const authRoute = require("./routes/authRoute");
const clientRoutes = require("./routes/clientRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const livreurRoutes = require("./routes/livreurRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Initialisation de l'application Express
const app = express();

// Connexion à MongoDB
connectDB();

// Configuration de CORS
app.use(
  cors({
    origin: "http://localhost:4200", // URL de l'application Angular
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware pour parser les requêtes JSON
app.use(bodyParser.json());

// Utilisation des routes
app.use("/api/auth", authRoute);
app.use("/api/clients", clientRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/livreurs", livreurRoutes);
app.use("/api/admins", adminRoutes);

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Quelque chose s'est mal passé !");
});

// Lancer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
