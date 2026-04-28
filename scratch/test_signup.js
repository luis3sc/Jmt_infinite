import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kssgxqyzzshtawtbnfry.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzc2d4cXl6enNodGF3dGJuZnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDcyNzUsImV4cCI6MjA4NTk4MzI3NX0.9f8LA8yvOhUfU58rR4kFV2wLw-KsPCDBBc7c-BHdJ8U'
);

async function test() {
  const email = 'testuser' + Date.now() + '@example.com';
  const password = 'Password123!';
  
  console.log('Signing up:', email);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Test User'
      }
    }
  });
  
  console.log('SignUp Error:', signUpError);
  console.log('SignUp Data:', JSON.stringify(signUpData, null, 2));
}

test();
