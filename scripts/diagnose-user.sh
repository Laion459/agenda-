#!/bin/bash
# Script de diagnóstico para verificar se o usuário agenda existe na imagem

set -e

echo "=== DIAGNÓSTICO: Verificando usuário 'agenda' na imagem ==="
echo ""

# 1. Verifica se a imagem existe
echo "1. Verificando se a imagem agenda-plus-backend existe..."
if ! docker image inspect agenda-plus-backend >/dev/null 2>&1; then
    echo "   ❌ Imagem agenda-plus-backend não encontrada!"
    echo "   Execute: docker-compose build backend"
    exit 1
fi
echo "   ✅ Imagem existe"
echo ""

# 2. Verifica se o usuário existe na imagem
echo "2. Verificando se o usuário 'agenda' existe na imagem..."
if docker run --rm agenda-plus-backend id agenda >/dev/null 2>&1; then
    echo "   ✅ Usuário 'agenda' EXISTE na imagem"
    docker run --rm agenda-plus-backend id agenda
else
    echo "   ❌ Usuário 'agenda' NÃO EXISTE na imagem!"
    echo ""
    echo "   Listando todos os usuários na imagem:"
    docker run --rm agenda-plus-backend cat /etc/passwd
    exit 1
fi
echo ""

# 3. Verifica o UID/GID do usuário
echo "3. Verificando UID/GID do usuário 'agenda'..."
docker run --rm agenda-plus-backend id agenda
echo ""

# 4. Verifica se o docker-compose consegue executar como o usuário
echo "4. Testando execução via docker-compose run..."
if docker-compose run --rm backend id agenda >/dev/null 2>&1; then
    echo "   ✅ docker-compose run funciona com usuário 'agenda'"
    docker-compose run --rm backend id agenda
else
    echo "   ❌ docker-compose run FALHA com usuário 'agenda'"
    echo "   Erro detalhado:"
    docker-compose run --rm backend id agenda 2>&1 || true
    exit 1
fi
echo ""

# 5. Verifica qual usuário o docker-compose está usando por padrão
echo "5. Verificando qual usuário o docker-compose usa por padrão..."
docker-compose run --rm backend whoami
echo ""

echo "=== DIAGNÓSTICO CONCLUÍDO ==="

