# Redis manager

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.1.4.

### Dependencies

- Node 10.x.x , npm 6.x.x
- redis 4.x
- docker

### Redis

- follow here https://redis.io/download download and compile redis server  or follow this commands

  ```
  $ wget http://download.redis.io/releases/redis-4.0.11.tar.gz
  $ tar xzf redis-4.0.11.tar.gz
  $ cd redis-4.0.11
  $ make
  ```

- start up redis server `cd src` `./redis-server --bind 0.0.0.0`
- load sample data into redis server, `cd src`,  then run this `cat <submission-folder>/simple-data-txt.txt | ./redis-cli --pipe` import simple data.

### Local run

- goto submission folder, run `npm i` first
- for a local build, run `npm run local`, and use browsers open http://127.0.0.1:3003
- for a production build, run `npm run start`, and use browsers open http://127.0.0.1:3003

### Docker build and run

- build image, make sure your dokcer already startup
  - run `./build-docker-image.sh` to build docker image, the image named **tc/redis-manager**
  - after build succeed, run `docker run -p 3003:3003 -it tc/redis-manager` to run image
  - then use browsers open http://127.0.0.1:3003

### Configs

| Key                                             | default          | Description                      |
| ----------------------------------------------- | ---------------- | -------------------------------- |
| config/default.js **PORT**                      | 3003             | the web app run port             |
| config/default.js **API_VERSION**               | api/1.0          | the backend endpoint prefix      |
| config/default.js **LOG_LEVEL**                 | Debug            | the backend log level            |
| config/default.js **defaultExternalConfigLink** | None             | the default external config link |
| src/environments/environments.ts **URI**        | /backend/api/1.0 | the backend uri used in frontend |



###  Additional document

- Frontend 

  - Angular 7
  - Angular Material https://material.angular.io/
  - Ngrx
  - Material Icons https://material.io/tools/icons/?style=baseline

- Backend

  - hapi.js
  - ioredis https://github.com/luin/ioredis

- Commands

  - what commands are included ? 

    INFO, GET, SET, RPUSH, SADD, ZADD, HMSET, LRANGE, ZRANGE, SMEMBERS, HGETALL, LLEN, SCARD, ZCARD, HLEN, SREM, ZREM, HSET, HDEL
  
- what commands should be added next?
  
    - Other commands may need according to functions.

  - which commands are dependent on one another?

    a web app function  dependent a lot of command, so, in fact, there is no command dependent on one another command.

Please note this app does not function in IE11+