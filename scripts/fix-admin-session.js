#!/usr/bin/env node

// Script to force session refresh and fix admin visibility
// Run this after logging in to production

const PRODUCTION_URL = 'https://www.nrghax.com';

async function fixAdminSession() {
  console.log('=== Admin Session Fix ===\n');

  console.log('Instructions:');
  console.log('1. Log into https://www.nrghax.com');
  console.log('2. Open browser console (F12)');
  console.log('3. Copy and paste this code:\n');

  const clientCode = `
// Force session refresh
fetch('/api/refresh-session', {
  method: 'POST',
  credentials: 'include'
})
.then(res => res.json())
.then(data => {
  console.log('Session refresh result:', data);
  if (data.success) {
    console.log('Profile:', data.profile);
    console.log('Reloading page...');
    window.location.reload();
  }
})
.catch(err => console.error('Error:', err));
`;

  console.log(clientCode);

  console.log('\n4. The page will reload automatically');
  console.log('5. You should now see admin navigation if you are an admin\n');

  console.log('\nAlternatively, check debug info:');
  console.log('Visit: ' + PRODUCTION_URL + '/api/admin-debug');
}

fixAdminSession();