# 🚀 Guia Rápido de Início - Agenda+

**Para quem acabou de fazer fork do repositório!**

Este guia vai te ajudar a rodar o projeto em **menos de 5 minutos**.

---

## ⚡ Início Rápido (3 passos)

### 1️⃣ Pré-requisitos

Certifique-se de ter instalado:
- ✅ **Docker** e **Docker Compose**
- ✅ **Make** (geralmente já vem no Linux/Mac, no Windows use WSL ou Git Bash)

### 2️⃣ Clone e Configure

```bash
# Clone o repositório
git clone <seu-fork-url>
cd "app agenda+"

# Execute o setup automático
make install
```

**O que o `make install` faz:**
- ✅ Constrói as imagens Docker
- ✅ Instala dependências do backend (Composer)
- ✅ Instala dependências do frontend (npm)
- ✅ Gera a chave da aplicação Laravel
- ✅ Executa migrações e popula o banco com dados de teste

### 3️⃣ Inicie os Serviços

```bash
make up
```

**Pronto!** 🎉 A aplicação está rodando em:
- 🌐 **Frontend:** http://localhost:3000
- 🔌 **Backend API:** http://localhost:8000
- 📚 **API Docs (Swagger):** http://localhost:8000/api/documentation
- 📧 **Mailpit (E-mails):** http://localhost:8025

---

## 🔑 Credenciais de Teste

Após executar `make install`, você pode usar estas credenciais:

### Administrador
- **Email:** `admin@agendaplus.test`
- **Senha:** `password`

### Médico
- **Email:** `dr.responsavel@agendaplus.test`
- **Senha:** `password`

### Paciente
- **Email:** `paciente.demo@agendaplus.test`
- **Senha:** `password`

---

## 📋 Comandos Úteis

```bash
# Ver status dos containers
make ps

# Ver logs em tempo real
make logs

# Parar todos os serviços
make down

# Reiniciar tudo
make restart

# Executar testes
make test

# Acessar shell do backend
make backend-shell

# Acessar shell do frontend
make frontend-shell
```

---

## ❓ Problemas Comuns

### Erro: "make: command not found"

**Windows:** Use WSL ou Git Bash  
**Linux/Mac:** Instale make: `sudo apt install make` (Linux) ou `xcode-select --install` (Mac)

### Erro: "Port already in use"

As portas 3000, 8000, 5432 ou 6379 estão em uso. Pare os serviços que estão usando essas portas ou altere no `docker-compose.yml`.

### Erro: "Cannot connect to database"

```bash
# Recrie o banco de dados
make down
docker volume rm agenda-plus_db-data
make install
make up
```

### Frontend não conecta ao backend

Verifique se o backend está rodando:
```bash
make ps
# Deve mostrar todos os containers como "Up"
```

---

## 📚 Próximos Passos

1. **Explore a API:** Acesse http://localhost:8000/api/documentation
2. **Teste o Frontend:** Faça login em http://localhost:3000
3. **Veja os E-mails:** Acesse http://localhost:8025 para ver e-mails enviados
4. **Leia a Documentação:**
   - [README Principal](./README.md)
   - [README do Backend](./backend/README.md)
   - [README do Frontend](./frontend/README.md)

---

## 🆘 Precisa de Ajuda?

- 📖 Consulte a seção [Troubleshooting](./README.md#-troubleshooting) no README principal
- 🐛 Abra uma issue no GitHub
- 📧 Entre em contato com os mantenedores

---

**Boa sorte com o projeto! 🚀**

