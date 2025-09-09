const bcrypt = require('bcryptjs');

// Test password
const password = 'test123';
const hash = '$2a$10$PkfZL5y1p1UUQZ2dYczwjuOS.i6D/aGFdX7S8TtmY5TpMq2u6.Mhe';

// Test if password matches
bcrypt.compare(password, hash, (err, result) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Password match:', result);
  }
});

// Also test synchronously
const match = bcrypt.compareSync(password, hash);
console.log('Sync password match:', match);