/* controllers/authController.js */
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');

const Client     = require('../models/Client');
const Restaurant = require('../models/Restaurant');
const Livreur    = require('../models/Livreur');
const Admin      = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_dev';

/* ----------------------------------------------------------
 * Middleware : vérification du token JWT
 * ---------------------------------------------------------- */
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];          // ex : "Bearer <token>"
  if (!authHeader) return res.status(401).json({ message: 'Token manquant.' });

  const token = authHeader.split(' ')[1];                   // "<token>"
  if (!token)   return res.status(401).json({ message: 'Format de token invalide.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);          // { userId, role, … }
    req.user = decoded;                                     // on attache à la requête
    next();                                                 // OK, route protégée suivante
  } catch (err) {
    return res.status(401).json({ message: 'Token expiré ou invalide.' });
  }
};

/* ----------------------------------------------------------
 * Inscription multi‑rôles
 * ---------------------------------------------------------- */
exports.register = async (req, res) => {
  const { name, email, password, phone, role, address, vehicle } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Tous les champs requis doivent être remplis.' });
  }

  try {
    let existingUser;
    switch (role) {
      case 'client':     existingUser = await Client.findOne({ email });      break;
      case 'restaurant': existingUser = await Restaurant.findOne({ email });  break;
      case 'livreur':    existingUser = await Livreur.findOne({ email });     break;
      case 'admin':      existingUser = await Admin.findOne({ email });       break;
      default:           return res.status(400).json({ message: 'Rôle invalide.' });
    }

    if (existingUser) {
      return res.status(400).json({ message: 'Utilisateur déjà existant.' });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    let newUser;

    switch (role) {
      case 'client':
        newUser = new Client({ name, email, phone, password: hashedPassword, role, address });
        break;
      case 'restaurant':
        newUser = new Restaurant({ name, email, phone, password: hashedPassword, role, address });
        break;
      case 'livreur':
        newUser = new Livreur({ name, email, phone, password: hashedPassword, role, vehicle });
        break;
      case 'admin':
        newUser = new Admin({ name, email, phone, password: hashedPassword, role });
        break;
    }

    await newUser.save();
    console.log('✅ Utilisateur créé (hash) :', hashedPassword);
    return res.status(201).json({ message: 'Utilisateur créé avec succès.' });
  } catch (error) {
    console.error('❌ Erreur inscription :', error);
    return res.status(500).json({ message: 'Erreur du serveur.' });
  }
};

/* ----------------------------------------------------------
 * Connexion multi‑rôles
 * ---------------------------------------------------------- */
exports.login = async (req, res) => {
  const { emailOrPhone, password } = req.body;
  if (!emailOrPhone || !password) {
    return res.status(400).json({ message: 'Email/Téléphone et mot de passe requis.' });
  }

  try {
    // Recherche dans l’ensemble des collections
    const user =
      await Client.findOne({     $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] }) ||
      await Restaurant.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] }) ||
      await Livreur.findOne({    $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] }) ||
      await Admin.findOne({      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] });

    if (!user) {
      console.log('❌ Utilisateur introuvable :', emailOrPhone);
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    const isMatch = await bcrypt.compare(password.trim(), user.password);
    console.log('🧪 bcrypt.compare =>', isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe incorrect.' });
    }

    // Génération du token
    const token = jwt.sign(
      { userId: user._id, role: user.role, status: user.status },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: {
        _id:    user._id,
        name:   user.name,
        email:  user.email,
        phone:  user.phone,
        role:   user.role,
        status: user.status || null
      }
    });
  } catch (error) {
    console.error('❌ Erreur login :', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

/* ----------------------------------------------------------
 * Récupération d’un utilisateur par ID
 * ---------------------------------------------------------- */
exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user =
      await Client.findById(id)     ||
      await Restaurant.findById(id) ||
      await Livreur.findById(id)    ||
      await Admin.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    return res.status(200).json({
      message: 'Utilisateur trouvé.',
      user: {
        id:     user._id,
        name:   user.name,
        email:  user.email,
        role:   user.role,
        phone:  user.phone,
        status: user.status || null
      }
    });
  } catch (error) {
    console.error('❌ Erreur getUserById :', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};
