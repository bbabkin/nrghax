const bcrypt = require('bcryptjs');

const password = 'test123';
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log('Password:', password);
console.log('Generated hash:', hash);

// Test it
const match = bcrypt.compareSync(password, hash);
console.log('Verification:', match);