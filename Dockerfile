FROM composer:2 AS composer

FROM php:8.2-cli

WORKDIR /app
COPY --from=composer /usr/bin/composer /usr/bin/composer
RUN apt-get update \
	&& docker-php-ext-install pdo_mysql \
	&& rm -rf /var/lib/apt/lists/*
COPY api ./api
RUN composer install --no-dev --working-dir=/app/api --prefer-dist --no-interaction

ENV DATA_DIR=/app/api/data
EXPOSE 10000
CMD ["php", "-S", "0.0.0.0:10000", "-t", "/app/api", "/app/api/index.php"]
