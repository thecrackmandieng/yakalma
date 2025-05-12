const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/yakalma', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connexion à MongoDB réussie !'))
.catch((err) => console.log('Erreur de connexion à MongoDB :', err));
