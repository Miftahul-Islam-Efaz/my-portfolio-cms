const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ofilalrcacqemfftmmwo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9maWxhbHJjYWNxZW1mZnRtbXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzU2OTEsImV4cCI6MjA5NTgxMTY5MX0.7i2pGgVQNokmLSD4Q740INMEBRezaujhZPEHtDr-Gzo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    const { data, error } = await supabase
      .from('portfolio_ratings')
      .select('*');
    
    console.log('--- ERROR ---');
    console.log(error);
    console.log('--- DATA ---');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();
