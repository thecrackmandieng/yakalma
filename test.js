const bcrypt = require('bcrypt');

const password = '8Tb0zw8XN8';

bcrypt.hash(password, 10).then(hash => {
  console.log('✅ Hash généré depuis mot de passe:', hash);

  bcrypt.compare(password, hash).then(result => {
    console.log('✅ Comparaison avec le hash généré à l’instant :', result); // doit être true
  });
});
