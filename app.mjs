import { drawAnswer, createShakeDetector } from './answers.mjs';

const oracle = document.querySelector('.oracle');
const ball = document.querySelector('#ball');
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
  oracle.classList.remove('revealed');
  oracle.classList.add('thinking');
  status.textContent = 'Vastaus tulossa.';
  answer.textContent = '';
  setTimeout(() => {
    const next = drawAnswer(topic, previous[topic]);
    previous[topic] = next;
    answer.textContent = next;
    status.textContent = '';
    oracle.classList.remove('thinking');
    oracle.classList.add('revealed');
    ball.removeAttribute('aria-disabled');
    busy = false;
    readyAt = performance.now() + 1200;
  }, reducedMotion.matches ? 350 : 1500);
}

let pointer = null;
let suppressClick = false;
let pointerShake = createShakeDetector(7);
ball.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0 || busy) return;
  pointer = { id: event.pointerId, start: event.clientX, last: event.clientX, moved: false };
  suppressClick = false;
  pointerShake = createShakeDetector(7);
  ball.setPointerCapture(event.pointerId);
});
ball.addEventListener('pointermove', event => {
  if (!pointer || event.pointerId !== pointer.id) return;
  const delta = event.clientX - pointer.last;
  const offset = event.clientX - pointer.start;
  pointer.moved ||= Math.abs(offset) > 8;
  if (Math.abs(delta) >= 7) pointer.last = event.clientX;
  if (!reducedMotion.matches) {
    ball.style.setProperty('--drag-x', `${Math.max(-32, Math.min(32, offset * .25))}px`);
    ball.style.setProperty('--drag-r', `${Math.max(-8, Math.min(8, offset * .06))}deg`);
  }
  if (pointerShake(delta, performance.now()) && performance.now() >= readyAt) reveal();
});
function release(event) {
  if (!pointer || event.pointerId !== pointer.id) return;
  suppressClick = pointer.moved;
  pointer = null;
  ball.style.removeProperty('--drag-x');
  ball.style.removeProperty('--drag-r');
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
  motionPrevious = null;
  deviceShake = createShakeDetector(12);
});
