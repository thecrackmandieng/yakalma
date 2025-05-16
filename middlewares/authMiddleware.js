const jwt = require("jsonwebtoken");

// Middleware pour vérifier si l'utilisateur est authentifié
exports.verifyToken = (req, res, next) => {
  // Récupérer le token du header Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Accès non autorisé. Token manquant." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.SECRET_KEY || "secretKey");

    // Ajouter les informations de l'utilisateur à l'objet req
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Erreur de vérification du token:", error);
    return res.status(401).json({ message: "Token invalide ou expiré." });
  }
};

// Middleware pour vérifier le rôle de l'utilisateur
exports.checkRole = (roles) => {
  return (req, res, next) => {
    // Vérifier si req.user existe (le middleware verifyToken doit être appelé avant)
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    // Vérifier si le rôle de l'utilisateur est autorisé
    if (roles.includes(req.user.role)) {
      next();
    } else {
      return res
        .status(403)
        .json({
          message: "Accès refusé. Vous n'avez pas les permissions nécessaires.",
        });
    }
  };
};
