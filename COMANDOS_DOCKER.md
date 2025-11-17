# Comandos Docker - Agenda+

## Comandos Básicos

### Reiniciar todos os containers
```bash
docker compose restart
```

### Parar todos os containers (sem remover)
```bash
docker compose stop
```

### Iniciar containers parados
```bash
docker compose start
```

### Parar e remover containers (mantém volumes)
```bash
docker compose down
```

### Parar, remover containers e volumes
```bash
docker compose down -v
```

### Iniciar containers em modo detached (background)
```bash
docker compose up -d
```

### Reiniciar completamente (down + up)
```bash
docker compose down && docker compose up -d
```

## Reiniciar Container Específico

### Reiniciar apenas o backend
```bash
docker compose restart backend
```

### Reiniciar apenas o frontend
```bash
docker compose restart frontend
```

### Reiniciar apenas o banco de dados
```bash
docker compose restart db
```

### Reiniciar apenas o Redis
```bash
docker compose restart redis
```

## Ver Status dos Containers

### Listar containers em execução
```bash
docker compose ps
```

### Ver logs de todos os containers
```bash
docker compose logs -f
```

### Ver logs de um container específico
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

## Rebuild Completo

### Reconstruir imagens e reiniciar
```bash
docker compose down
docker compose build --pull
docker compose up -d
```

## Comandos Úteis

### Executar comando no container backend
```bash
docker compose exec backend php artisan [comando]
```

### Acessar shell do backend
```bash
docker compose exec backend bash
```

### Acessar shell do frontend
```bash
docker compose exec frontend sh
```

### Acessar PostgreSQL
```bash
docker compose exec db psql -U agenda -d agenda
```

### Acessar Redis CLI
```bash
docker compose exec redis redis-cli
```

## Recriar Banco de Dados

### Recriar banco com seeders
```bash
docker compose run --rm backend php artisan migrate:fresh --seed
```

### Apenas executar migrations
```bash
docker compose run --rm backend php artisan migrate
```

### Apenas executar seeders
```bash
docker compose run --rm backend php artisan db:seed
```

