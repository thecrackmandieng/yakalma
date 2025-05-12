const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Importation des modèles utilisateur
const Client = require('../models/Client');
const Restaurant = require('../models/Restaurant');
const Livreur = require('../models/Livreur');
const Admin = require('../models/Admin');

// Fonction d'inscription (register)
exports.register = async (req, res) => {
  const { name, email, password, phone, role, address, vehicle } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  try {
    // Vérifier si l'utilisateur existe déjà dans la base de données
    let existingUser;
    switch (role) {
      case 'client':
        existingUser = await Client.findOne({ email });
        break;
      case 'restaurant':
        existingUser = await Restaurant.findOne({ email });
        break;
      case 'livreur':
        existingUser = await Livreur.findOne({ email });
        break;
      case 'admin':
        existingUser = await Admin.findOne({ email });
        break;
      default:
        return res.status(400).json({ message: 'Rôle invalide.' });
    }

    if (existingUser) {
      return res.status(400).json({ message: 'Cet utilisateur existe déjà.' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouvel utilisateur selon son rôle
    let newUser;
    if (role === 'client') {
      newUser = new Client({ name, email, phone, password: hashedPassword, role, address });
    } else if (role === 'restaurant') {
      newUser = new Restaurant({ name, email, phone, password: hashedPassword, role, address });
    } else if (role === 'livreur') {
      newUser = new Livreur({ name, email, phone, password: hashedPassword, role, vehicle });
    } else if (role === 'admin') {
      newUser = new Admin({ name, email, phone, password: hashedPassword, role });
    }

    // Sauvegarder l'utilisateur dans la base de données
    await newUser.save();
    res.status(201).json({ message: 'Utilisateur créé avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur du serveur.' });
  }
};
// Fonction de connexion (login)
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe sont requis.' });
  }

  try {
    // Chercher l'utilisateur dans toutes les collections selon le modèle
    let user;
    user = await Client.findOne({ email });
    if (!user) {
      user = await Restaurant.findOne({ email });
    }
    if (!user) {
      user = await Livreur.findOne({ email });
    }
    if (!user) {
      user = await Admin.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Vérifier si le mot de passe est correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe incorrect.' });
    }

    // Créer un token JWT pour la session de l'utilisateur
    const token = jwt.sign(
      { userId: user._id, role: user.role },  // Inclure l'ID de l'utilisateur et le rôle dans le token
      process.env.SECRET_KEY || 'secretKey',  // Utiliser une clé secrète pour signer le JWT
      { expiresIn: '1h' }  // Durée d'expiration du token
    );

    res.status(200).json({ 
      message: 'Connexion réussie.', 
      token, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role } // Inclure des informations utilisateur
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur du serveur.' });
  }
};
// Fonction pour obtenir les détails d'un utilisateur par ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    // Rechercher l'utilisateur dans toutes les collections
    let user;
    user = await Client.findById(id);
    if (!user) {
      user = await Restaurant.findById(id);
    }
    if (!user) {
      user = await Livreur.findById(id);
    }
    if (!user) {
      user = await Admin.findById(id);
    }

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    res.status(200).json({ 
      message: 'Utilisateur trouvé.', 
      user: { id: user._id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur du serveur.' });
  }
};