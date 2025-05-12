const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Définition du schéma de l'utilisateur
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Création du modèle User
const User = mongoose.model('User', userSchema);

module.exports = User;
