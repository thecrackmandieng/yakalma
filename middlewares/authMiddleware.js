const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secretKey";

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Accès non autorisé. Token manquant." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Erreur de vérification du token:", error);
    return res.status(401).json({ message: "Token invalide ou expiré." });
  }
};

exports.checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié." });
    }
    if (roles.includes(req.user.role)) {
      next();
    } else {
      return res.status(403).json({
        message: "Accès refusé. Vous n'avez pas les permissions nécessaires.",
      });
    }
  };
};

exports.verifyLivreurRole = (req, res, next) => {
  if (req.user && req.user.role === 'livreur') {
    next();
  } else {
    res.status(403).json({ message: "Accès refusé : rôle livreur requis." });
  }
};

