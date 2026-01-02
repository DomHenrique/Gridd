#!/bin/sh

# ============================================================================
# Runtime Environment Variable Injection for Docker
# ============================================================================
# Este script gera o arquivo env-config.js que expõe variáveis de ambiente
# para o frontend via window._env_
#
# SEGURANÇA: Apenas variáveis PÚBLICAS devem ser expostas!
# ============================================================================

# Recreate config file
rm -rf /usr/share/nginx/html/env-config.js
touch /usr/share/nginx/html/env-config.js

# Add assignment 
echo "window._env_ = {" >> /usr/share/nginx/html/env-config.js

# Lista de variáveis PÚBLICAS permitidas (whitelist)
# NUNCA adicione secrets, passwords, ou client_secrets aqui!
PUBLIC_VARS="
VITE_API_URL
VITE_APP_URL
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_GOOGLE_CLIENT_ID
VITE_GOOGLE_REDIRECT_URI
VITE_ADMIN_EMAIL
VITE_COMPANY_DOMAIN
VITE_WEBHOOK_URL
NODE_ENV
"

# Read environment variables safely (apenas as públicas)
for var_name in $PUBLIC_VARS; do
  # Pegar o valor da variável
  var_value=$(printenv "$var_name")
  
  # Se a variável existe, adicionar ao arquivo
  if [ -n "$var_value" ]; then
    # Escapar aspas duplas no valor
    escaped_value=$(echo "$var_value" | sed 's/"/\\"/g')
    echo "  $var_name: \"$escaped_value\"," >> /usr/share/nginx/html/env-config.js
  fi
done

echo "}" >> /usr/share/nginx/html/env-config.js

# Debug: Print content to log
echo "Generated env-config.js (PUBLIC VARS ONLY):"
cat /usr/share/nginx/html/env-config.js
