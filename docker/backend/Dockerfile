# syntax=docker/dockerfile:1.6

ARG PHP_VERSION=8.3
ARG UID=1000
ARG GID=1000

FROM php:${PHP_VERSION}-cli AS base

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_MEMORY_LIMIT=-1 \
    PATH="/usr/local/bin:$PATH"

WORKDIR /var/www/html

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        git \
        unzip \
        zip \
        libpq-dev \
        libzip-dev \
        libicu-dev \
        libssl-dev \
        pkg-config && \
    docker-php-ext-configure intl && \
    docker-php-ext-install intl pdo pdo_pgsql pcntl zip bcmath && \
    pecl install redis && \
    docker-php-ext-enable redis && \
    rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

# Cria grupo e usuário com UID/GID específicos (sem nome fixo para evitar problemas)
RUN if ! getent group ${GID} >/dev/null 2>&1; then \
        groupadd --gid ${GID} agenda; \
    fi && \
    if ! getent passwd ${UID} >/dev/null 2>&1; then \
        useradd --uid ${UID} --gid ${GID} --shell /bin/bash --create-home --no-log-init agenda; \
    fi && \
    id ${UID} || id agenda

# -------------------------------------------------------------------
# Vendor stage: installs production dependencies once, cached by Docker
# -------------------------------------------------------------------
FROM base AS vendor
WORKDIR /var/www/html

COPY backend/composer.json backend/composer.lock ./
RUN composer install \
    --no-dev \
    --prefer-dist \
    --no-progress \
    --no-interaction \
    --no-scripts \
    --optimize-autoloader

# -------------------------------------------------------------------
# Development image: hot-reload + dev dependencies
# -------------------------------------------------------------------
FROM base AS development

# Re-declara ARGs para garantir que estejam disponíveis
ARG UID=1000
ARG GID=1000

# Armazena os valores em ENV para garantir que estejam disponíveis em runtime
ENV DOCKER_UID=${UID} \
    DOCKER_GID=${GID} \
    APP_ENV=local \
    APP_DEBUG=true

WORKDIR /var/www/html

# Garante que o usuário com UID/GID existe e é verificado
RUN if ! getent passwd ${UID} >/dev/null 2>&1; then \
        (getent group ${GID} >/dev/null 2>&1 || groupadd --gid ${GID} agenda) && \
        useradd --uid ${UID} --gid ${GID} --shell /bin/bash --create-home --no-log-init agenda; \
    fi && \
    getent passwd ${UID} && \
    test -n "$(getent passwd ${UID})" && \
    id ${UID}

COPY backend/composer.json backend/composer.lock ./
RUN composer install \
    --prefer-dist \
    --no-progress \
    --no-interaction \
    --no-scripts

COPY backend /var/www/html

# Usa UID:GID diretamente - mais confiável que nome de usuário
USER ${UID}:${GID}

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]

# -------------------------------------------------------------------
# Production image: optimized autoloader + cached config/routes
# -------------------------------------------------------------------
FROM base AS production

# Re-declara ARGs para garantir que estejam disponíveis
ARG UID=1000
ARG GID=1000

ENV APP_ENV=production \
    APP_DEBUG=false

WORKDIR /var/www/html

COPY backend /var/www/html
COPY --from=vendor /var/www/html/vendor /var/www/html/vendor

RUN chown -R ${UID}:${GID} storage bootstrap/cache

# Usa UID:GID diretamente ao invés de nome de usuário (mais confiável)
USER ${UID}:${GID}

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]

