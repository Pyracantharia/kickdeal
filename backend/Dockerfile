FROM php:8.4-fpm-alpine

# Install Nginx et Supervisor
RUN apk add --no-cache nginx supervisor icu-dev libzip-dev postgresql-dev

RUN docker-php-ext-install intl pdo pdo_pgsql zip

COPY docker/php/uploads.ini /usr/local/etc/php/conf.d/uploads.ini

# Config Nginx
COPY docker/nginx/default.conf /etc/nginx/http.d/default.conf

# Config Supervisor (pour lancer PHP-FPM et Nginx ensemble)
RUN printf "[supervisord]\nnodaemon=true\nlogfile=/dev/null\nlogfile_maxbytes=0\n\n[program:nginx]\ncommand=nginx -g 'daemon off;'\n\n[program:php-fpm]\ncommand=php-fpm\n" > /etc/supervisord.conf \
	&& chmod 644 /etc/supervisord.conf

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

ARG UID=1000
ARG GID=1000
ARG USERNAME=kickdeal-user
RUN addgroup -g ${GID} -S ${USERNAME} \
	&& adduser -S -D -u ${UID} -G ${USERNAME} ${USERNAME}

WORKDIR /var/www/html
COPY . .

RUN composer install --no-interaction

# Permissions
RUN chown -R ${USERNAME}:${USERNAME} /var/www/html

USER ${USERNAME}

EXPOSE 8080
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
