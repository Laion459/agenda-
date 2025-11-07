# syntax=docker/dockerfile:1.5

FROM php:8.3-cli AS base

ARG UID=1000
ARG GID=1000

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_MEMORY_LIMIT=-1 \
    APP_ENV=local

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

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN groupadd -g ${GID} agenda || true && \
    useradd -u ${UID} -g ${GID} -m agenda || true

USER agenda

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]

