FROM node:8.11.2

LABEL app="redis-manager" version="1.0"

WORKDIR /opt/app
COPY . .

RUN npm install

EXPOSE 3003
CMD ["npm", "start"]
