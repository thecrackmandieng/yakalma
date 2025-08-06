require('dotenv').config(); // Charger les variables d'environnement

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require('fs');
const connectDB = require("./config/db");

// Importation des routes
const authRoute = require("./routes/authRoute");
const clientRoutes = require("./routes/clientRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const livreurRoutes = require("./routes/livreurRoutes");
const adminRoutes = require("./routes/adminRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes"); // ✅ Nouveau : route pour le panier

const app = express();

// Connexion à MongoDB
connectDB();

// Middleware CORS
app.use(cors({
  origin: "http://localhost:4200", // Autoriser le frontend Angular
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Middleware pour parser le JSON
app.use(express.json());

// Sert le dossier "uploads" statiquement (accessible publiquement)
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Vérifie si le dossier "uploads" existe (optionnel)
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// ------------------------
// Définition des routes
// ------------------------
app.use("/api/auth", authRoute);
app.use("/api/clients", clientRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/livreurs", livreurRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes); // ✅ Routes du panier

// ------------------------
// Gestion globale des erreurs serveur
// ------------------------
app.use((err, req, res, next) => {
  console.error("❌ Erreur globale :", err.stack);
  res.status(500).json({ message: "Quelque chose s'est mal passé !", error: err.message });
});

// ------------------------
// Lancement du serveur
// ------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur en cours d'exécution sur le port ${PORT}`);
});
