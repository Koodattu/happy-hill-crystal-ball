FROM caddy:2.11.9-alpine@sha256:003a97808e781aa9f7e75cc2f43d34d461099031faf5e20faefb9f61126836f0
RUN setcap -r /usr/bin/caddy
COPY --chmod=644 Caddyfile /etc/caddy/Caddyfile
COPY --chmod=644 index.html style.css app.mjs answers.mjs favicon.svg Capture.PNG capture2.PNG capture3.PNG capture4.PNG capture5.PNG /srv/
USER 1000:1000
