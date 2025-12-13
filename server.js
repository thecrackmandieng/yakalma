require('dotenv').config(); // Charger les variables d'environnement

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db");

// Importation des routes
const authRoute = require("./routes/authRoute");
const clientRoutes = require("./routes/clientRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const livreurRoutes = require("./routes/livreurRoutes");
const adminRoutes = require("./routes/adminRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const walletRoutes = require("./routes/wallet.routes"); // ✅ Route Wallet

const app = express();

// ------------------------
// Connexion à MongoDB
// ------------------------
connectDB();

// ------------------------
// Middleware CORS
// ------------------------
const allowedOrigins = [
  "http://localhost:4200",                 // Frontend en dev
  "https://yakalma-frontend.onrender.com",  // Frontend en prod
  "https://yakalma-client.onrender.com"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Postman / curl
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS non autorisé : " + origin));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Middleware pour parser le JSON
app.use(express.json());

// ------------------------
// Gestion des fichiers statiques "uploads"
// ------------------------
const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use("/uploads", express.static(uploadsPath));

// ------------------------
// Définition des routes API
// ------------------------
app.use("/api/auth", authRoute);
app.use("/api/clients", clientRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/livreurs", livreurRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wallet", walletRoutes); // ✅ Wallet / history / update

// ------------------------
// Route test simple
// ------------------------
app.get("/api/ping", (req, res) => {
  res.json({ message: "✅ Backend Yakalma opérationnel !" });
});

// ------------------------
// Gestion globale des erreurs serveur
// ------------------------
app.use((err, req, res, next) => {
  console.error("❌ Erreur globale :", err.stack || err);
  res.status(500).json({
    message: "Quelque chose s'est mal passé !",
    error: err.message || err,
  });
});

// ------------------------
// Lancement du serveur
// ------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Serveur en cours d'exécution sur le port ${PORT}`);
});
