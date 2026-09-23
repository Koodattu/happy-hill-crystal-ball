FROM caddy:2.11.4-alpine@sha256:5f5c8640aae01df9654968d946d8f1a56c497f1dd5c5cda4cf95ab7c14d58648
RUN setcap -r /usr/bin/caddy
COPY Caddyfile /etc/caddy/Caddyfile
COPY index.html style.css app.mjs answers.mjs favicon.svg Capture.PNG capture2.PNG capture3.PNG capture4.PNG capture5.PNG /srv/
USER 1000:1000
