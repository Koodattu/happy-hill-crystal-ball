# Happy Hillin kristallipallo

100 Finnish executive non-answers, five topics, one crystal ball. Static HTML,
CSS and JavaScript; no framework, build step, API, database, analytics or external
requests. The supplied `Capture.PNG` fades into the CSS glass orb after a shake.

## Run

```sh
docker compose up -d --build --wait
```

Open http://localhost:8080. For development without Docker, run
`python -m http.server 8080 --bind 127.0.0.1` in this directory.

Drag the ball back and forth, click it, or focus it and press Enter or Space.
On supported touch devices over HTTPS, enable phone shaking with
the separate permission button. Denied or unavailable motion sensors leave the
ball usable. Reduced-motion preferences disable decorative movement.
Answers are selected within the chosen topic without immediate repeats.

## Verify

```sh
node --test tests/oracle.test.mjs
node --check app.mjs
docker compose config --quiet
```

Check desktop and mobile layouts, each topic, repeated answers, pointer shaking,
keyboard activation and reduced motion. Real phone sensor behavior requires a
physical HTTPS-capable device; desktop emulation cannot verify its hardware.

## Production

Hosted at https://kristallipallo.koodattu.dev on `vaarattu-server`.
The sibling `deployments` repository owns public TLS, Caddy routing, the isolated
`ingress_crystal_ball` network and polling of this repository's `main` branch.
This container only serves static files on port 8080 as an unprivileged user.
The production override removes the local host port. No secrets are needed.

```sh
cd /srv/projects/happy-hill-crystal-ball
docker compose -f compose.yaml -f ../deployments/overrides/happy-hill-crystal-ball.yaml config --quiet
docker compose -f compose.yaml -f ../deployments/overrides/happy-hill-crystal-ball.yaml up -d --build --wait
```

Future pushes to `main` are picked up by the existing systemd auto-deploy timer.
To roll back, revert the relevant commit and push the revert to `main`.
