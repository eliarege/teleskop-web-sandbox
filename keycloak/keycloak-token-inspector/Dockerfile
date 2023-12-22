FROM node:20-alpine

WORKDIR /usr/src/app

COPY dist/ ./

RUN npm install -g serve

EXPOSE 8082

ENTRYPOINT [ "serve", "-l", "8082" ]
