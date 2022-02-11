FROM node:8.17.0

LABEL app="redis-manager" version="1.0"

WORKDIR /opt/app
# install and cache app dependencies
COPY package.json /opt/app/package.json
RUN npm install
COPY . .

EXPOSE 3003
CMD ["npm", "run", "start"]
