## Verfication Guide

#1 Support redis cluster
* To verify the first point, set up a redis cluster following the updated readme and connect from the UI.
* Once connected, you should be able to send commands and recieve response from cluster like this:
    ```
      > get foo
      (nil)
      > set foo bar
      Ok
      > get foo
      bar
    ```
#1.1 And in the connect endpoint, when the connection with id already exists, you should also check if the properties (e.g. host name, port, cluster etc...) are changed or not. If changed, disconnect the old one and reconnect. 

* To verify this, manually edit the localStorage, refresh the page and try to connect.

#2 Add a disconnect endpoint to the backend. 

* This is implemented and integrated with the disconnect button above the instance info

#3 To verify if the backend removes the cache, 
* run the server in dev mode (using ndb is recommended for running in debug mode) put a breakpoint in reconnecting callback in redis.js. 
* set MAX_RETRIES in config/default.js. 

#3.1 To verify idle timeout
* set a very low value (say 1) in the config/default.js > IDLE_TIMEOUT_IN_MINS variable. 
* wait for 1 minute and run `get foo` from the UI. This will fail unless you manually reconnected in the meantime.

 