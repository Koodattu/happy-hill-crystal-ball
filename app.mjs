import { drawAnswer, createShakeDetector } from './answers.mjs';

const oracle = document.querySelector('.oracle');
const ball = document.querySelector('#ball');
const stage = document.querySelector('.ball-stage');
const status = document.querySelector('#oracle-status');
const answer = document.querySelector('#answer');
const motionToggle = document.querySelector('#motion-toggle');
const motionStatus = document.querySelector('#motion-status');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const previous = {};
let busy = false;
let readyAt = 0;

function reveal() {
  if (busy) return;
  const topic = document.querySelector('input[name="topic"]:checked').value;
  busy = true;
  ball.setAttribute('aria-disabled', 'true');
  oracle.classList.remove('revealed', 'manifesting');
  oracle.classList.add('thinking');
  status.textContent = 'Vastaus tulossa.';
  // Let the previous answer dissolve before replacing its text.
  setTimeout(() => { answer.textContent = ''; }, reducedMotion.matches ? 0 : 700);
  setTimeout(() => {
    document.querySelector('.apparition.is-active').classList.remove('is-active');
    document.querySelector(`.apparition[data-topic="${topic}"]`).classList.add('is-active');
    oracle.classList.add('manifesting');
  }, reducedMotion.matches ? 50 : 1800);
  setTimeout(() => {
    const next = drawAnswer(topic, previous[topic]);
    previous[topic] = next;
    answer.textContent = next;
    status.textContent = '';
    oracle.classList.add('revealed');
  }, reducedMotion.matches ? 100 : 2900);
  setTimeout(() => {
    oracle.classList.remove('thinking');
    ball.removeAttribute('aria-disabled');
    busy = false;
    readyAt = performance.now() + 1200;
  }, reducedMotion.matches ? 200 : 4400);
}

let pointer = null;
let suppressClick = false;
let shakeX = createShakeDetector(7);
let shakeY = createShakeDetector(7);
const position = { x: 0, y: 0, vx: 0, vy: 0 };
const target = { x: 0, y: 0 };
let frame = 0;
let lastFrame = 0;

function animatePosition(now) {
  const dt = Math.min((now - lastFrame) / 1000 || 1 / 60, 1 / 30);
  lastFrame = now;
  for (const axis of ['x', 'y']) {
    const velocity = `v${axis}`;
    position[velocity] += ((target[axis] - position[axis]) * 190 - position[velocity] * 18) * dt;
    position[axis] += position[velocity] * dt;
  }
  const settled = !pointer && Math.hypot(position.x, position.y, position.vx, position.vy) < .15;
  if (settled || reducedMotion.matches) {
    position.x = target.x;
    position.y = target.y;
    position.vx = position.vy = 0;
  }
  stage.style.setProperty('--move-x', `${position.x.toFixed(2)}px`);
  stage.style.setProperty('--move-y', `${position.y.toFixed(2)}px`);
  stage.style.setProperty('--tilt', `${(position.x * .07).toFixed(2)}deg`);
  stage.style.setProperty('--light-x', `${(-position.x * .12).toFixed(2)}px`);
  stage.style.setProperty('--light-y', `${(-position.y * .1).toFixed(2)}px`);
  stage.style.setProperty('--shadow-scale', String(1 + position.y * .002));
  frame = settled || reducedMotion.matches ? 0 : requestAnimationFrame(animatePosition);
}

function moveBall() {
  if (!frame) {
    lastFrame = performance.now();
    frame = requestAnimationFrame(animatePosition);
  }
}

ball.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return;
  pointer = {
    id: event.pointerId, startX: event.clientX, startY: event.clientY,
    lastX: event.clientX, lastY: event.clientY, moved: false,
    originX: position.x, originY: position.y,
    limitX: Math.min(160, Math.max(16, (innerWidth - ball.offsetWidth) / 2 - 12)),
  };
  suppressClick = false;
  shakeX = createShakeDetector(7);
  shakeY = createShakeDetector(7);
  oracle.classList.add('dragging');
  ball.setPointerCapture(event.pointerId);
});
ball.addEventListener('pointermove', event => {
  if (!pointer || event.pointerId !== pointer.id) return;
  const dx = event.clientX - pointer.lastX;
  const dy = event.clientY - pointer.lastY;
  const offsetX = event.clientX - pointer.startX;
  const offsetY = event.clientY - pointer.startY;
  pointer.moved ||= Math.hypot(offsetX, offsetY) > 8;
  if (Math.abs(dx) >= 7) pointer.lastX = event.clientX;
  if (Math.abs(dy) >= 7) pointer.lastY = event.clientY;
  target.x = pointer.limitX * Math.tanh((pointer.originX + offsetX) / pointer.limitX);
  target.y = 110 * Math.tanh((pointer.originY + offsetY) / 110);
  moveBall();
  const now = performance.now();
  const shakenX = shakeX(dx, now);
  const shakenY = shakeY(dy, now);
  if ((shakenX || shakenY) && now >= readyAt) reveal();
});
function release(event) {
  if (!pointer || event.pointerId !== pointer.id) return;
  suppressClick = pointer.moved;
  pointer = null;
  oracle.classList.remove('dragging');
  target.x = target.y = 0;
  moveBall();
}
ball.addEventListener('pointerup', release);
ball.addEventListener('pointercancel', release);
ball.addEventListener('lostpointercapture', release);
ball.addEventListener('click', event => {
  if (event.detail === 0 || !suppressClick) reveal();
  suppressClick = false;
});

let motionEnabled = false;
let motionTimeout;
let motionPrevious = null;
let deviceShake = createShakeDetector(12);
function onMotion(event) {
  const acceleration = event.accelerationIncludingGravity;
  if (!acceleration || ![acceleration.x, acceleration.y, acceleration.z].every(Number.isFinite)) return;
  clearTimeout(motionTimeout);
  motionStatus.textContent = '';
  const current = [acceleration.x, acceleration.y, acceleration.z];
  if (motionPrevious && !document.hidden) {
    const changes = current.map((value, index) => value - motionPrevious[index]);
    const strongest = changes.reduce((a, b) => Math.abs(a) > Math.abs(b) ? a : b);
    if (deviceShake(strongest, performance.now()) && performance.now() >= readyAt) reveal();
  }
  motionPrevious = current;
}
function disableMotion() {
  window.removeEventListener('devicemotion', onMotion);
  clearTimeout(motionTimeout);
  motionEnabled = false;
  motionPrevious = null;
  motionToggle.textContent = 'Ota ravistus käyttöön';
}
if (window.isSecureContext && 'DeviceMotionEvent' in window && matchMedia('(pointer: coarse)').matches) {
  motionToggle.hidden = false;
  motionToggle.addEventListener('click', async () => {
    if (motionEnabled) {
      disableMotion();
      motionStatus.textContent = '';
      return;
    }
    try {
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission !== 'granted') {
          motionStatus.textContent = 'Ravistuslupaa ei saatu. Paina palloa.';
          return;
        }
      }
      deviceShake = createShakeDetector(12);
      motionEnabled = true;
      motionToggle.textContent = 'Poista ravistus käytöstä';
      motionStatus.textContent = '';
      window.addEventListener('devicemotion', onMotion);
      motionTimeout = setTimeout(() => {
        disableMotion();
        motionStatus.textContent = 'Liiketunnistinta ei löytynyt. Paina palloa.';
      }, 3500);
    } catch {
      disableMotion();
      motionStatus.textContent = 'Ravistus ei ole käytettävissä. Paina palloa.';
    }
  });
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden && pointer) {
    const id = pointer.id;
    release({ pointerId: id });
    if (ball.hasPointerCapture(id)) ball.releasePointerCapture(id);
  }
  motionPrevious = null;
  deviceShake = createShakeDetector(12);
});
