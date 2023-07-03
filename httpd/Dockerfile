FROM httpd AS base

FROM base AS production
COPY ./httpd/conf/prod /usr/local/apache2/conf
COPY ./ssl /usr/local/apache2/conf/ssl

FROM base AS development
COPY ./httpd/conf/dev /usr/local/apache2/conf
