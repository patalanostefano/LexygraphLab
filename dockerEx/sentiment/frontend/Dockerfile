FROM nginx
RUN apt-get update && apt-get upgrade -y
RUN apt-get install -y build-essential
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
RUN apt-get install -y nodejs
COPY . .
RUN npm install
RUN npm run build
RUN cp -r /build/. /usr/share/nginx/html
RUN rm -rf node_modules

