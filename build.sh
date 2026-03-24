#!/bin/sh
# Generate config.js from Vercel environment variables.
# Set these in: Vercel Dashboard → Settings → Environment Variables

cat > config.js << JSEOF
const CONFIG = {
  SUPABASE_URL: '${SUPABASE_URL}',
  SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}',
  OPENAI_KEY: '${OPENAI_KEY}',
};
JSEOF

echo "config.js generated from environment variables"
