const { createClient } = require('@supabase/supabase-js');

// Use the values from .env.local
const supabaseUrl = 'https://cyheqixpelunldhtjyye.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5aGVxaXhwZWx1bmxkaHRqeXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDA2NDksImV4cCI6MjA4MDgxNjY0OX0.8b9Xo-GXPdZYX1xwWEzKpJ-lVhl6iD-pD2Q1iCKRMXg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'password123';

  console.log(`Attempting to sign up with ${email}...`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Signup Error:', error);
  } else {
    console.log('Signup Success:', data);
  }
}

testSignup();
