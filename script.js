/* script.js
   Logic for Percentage Calculator (modern UI)
*/
(function(){
  // Elements
  const form = document.getElementById('calcForm');
  const initialInput = document.getElementById('initialValue');
  const finalInput = document.getElementById('finalValue');
  const initialError = document.getElementById('initialError');
  const finalError = document.getElementById('finalError');
  const resultCard = document.getElementById('resultCard');
  const percentText = document.getElementById('percentText');
  const percentSub = document.getElementById('percentSub');
  const valueLabel = document.getElementById('valueLabel');
  const absLabel = document.getElementById('absLabel');
  const statusBadge = document.getElementById('statusBadge');
  const progressRing = document.getElementById('progressRing');
  const copyBtn = document.getElementById('copyBtn');
  const resetBtn = document.getElementById('resetBtn');
  const toast = document.getElementById('toast');

  const R = 48;
  const CIRC = 2 * Math.PI * R; // ~302

  // Number format (Indonesian)
  const nf = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });

  function showError(el, msg) {
    el.textContent = msg;
  }
  function clearErrors() {
    initialError.textContent = '';
    finalError.textContent = '';
  }

  function animateNumber(element, from, to, duration=700, suffix='') {
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const value = from + (to - from) * eased;
      element.textContent = (to >= 0 ? (value >= 0 ? '+' : '') : '') + nf.format(value) + suffix;
      if (t < 1) requestAnimationFrame(frame);
      else element.textContent = (to >= 0 ? (to >= 0 ? '+' : '') : '') + nf.format(to) + suffix;
    }
    requestAnimationFrame(frame);
  }

  function setRing(percentage, duration=900) {
    // percentage is absolute (e.g., 25 for 25%)
    const capped = Math.min(Math.abs(percentage), 999);
    const targetOffset = CIRC - (CIRC * (Math.min(capped, 200) / 200)); // map 0..200% to 0..100% ring
    const start = parseFloat(progressRing.getAttribute('data-offset') || CIRC);
    const delta = targetOffset - start;
    const t0 = performance.now();
    function anim(now) {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = start + delta * eased;
      progressRing.style.strokeDashoffset = cur;
      progressRing.setAttribute('data-offset', cur);
      if (t < 1) requestAnimationFrame(anim);
    }
    requestAnimationFrame(anim);
  }

  function displayResult(initialValue, finalValue) {
    resultCard.setAttribute('aria-hidden', 'false');

    const absChange = finalValue - initialValue;
    const absText = 'Perubahan absolut: ' + nf.format(absChange);
    absLabel.textContent = absText;
    valueLabel.textContent = `Nilai Awal ${nf.format(initialValue)} → Nilai Akhir ${nf.format(finalValue)}`;

    if (initialValue === 0) {
      if (finalValue === 0) {
        percentText.textContent = '0,00 %';
        percentSub.textContent = 'Tidak ada perubahan relatif';
        statusBadge.textContent = 'No change';
        statusBadge.className = 'status nochange';
        setRing(0);
      } else {
        percentText.textContent = '—';
        percentSub.textContent = 'Tidak terdefinisi (Nilai Awal = 0)';
        statusBadge.textContent = 'Undefined';
        statusBadge.className = 'status';
        setRing(0);
      }
      return;
    }

    const perc = ((finalValue - initialValue) / initialValue) * 100;
    const percRounded = Math.round(perc * 100) / 100; // keep two decimals
    // animate percent number
    animateNumber(percentText, 0, percRounded, 800, ' %');

    // status badge and ring color
    if (perc > 0) {
      statusBadge.textContent = 'Kenaikan';
      statusBadge.className = 'status increase';
      progressRing.setAttribute('stroke', 'url(#g2)');
    } else if (perc < 0) {
      statusBadge.textContent = 'Penurunan';
      statusBadge.className = 'status decrease';
      progressRing.setAttribute('stroke', 'url(#g1)');
    } else {
      statusBadge.textContent = 'Tidak berubah';
      statusBadge.className = 'status';
      progressRing.setAttribute('stroke', 'url(#g1)');
    }

    // animate ring using absolute percentage (visual mapping)
    setRing(Math.abs(perc));
  }

  function showToast(msg='Disalin ke clipboard') {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    clearErrors();
    resultCard.setAttribute('aria-hidden', 'true');

    const rawInitial = initialInput.value.trim();
    const rawFinal = finalInput.value.trim();

    if (rawInitial === '') {
      showError(initialError, 'Nilai Awal wajib diisi.');
      initialInput.focus();
      return;
    }
    if (rawFinal === '') {
      showError(finalError, 'Nilai Akhir wajib diisi.');
      finalInput.focus();
      return;
    }

    const initialValue = Number(rawInitial);
    const finalValue = Number(rawFinal);

    if (!isFinite(initialValue)) {
      showError(initialError, 'Masukkan angka yang valid.');
      return;
    }
    if (!isFinite(finalValue)) {
      showError(finalError, 'Masukkan angka yang valid.');
      return;
    }

    // show result
    displayResult(initialValue, finalValue);
  });

  copyBtn.addEventListener('click', async () => {
    const percent = percentText.textContent || '—';
    const abs = absLabel.textContent || '—';
    const val = valueLabel.textContent || '—';
    const text = `Perubahan: ${percent}\n${abs}\n${val}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Hasil disalin ke clipboard');
    } catch (err) {
      showToast('Gagal menyalin');
    }
  });

  resetBtn.addEventListener('click', () => {
    initialInput.value = '';
    finalInput.value = '';
    clearErrors();
    resultCard.setAttribute('aria-hidden', 'true');
    percentText.textContent = '—';
    percentSub.textContent = 'Perubahan';
    valueLabel.textContent = '—';
    absLabel.textContent = '—';
    statusBadge.textContent = '—';
    progressRing.style.strokeDashoffset = CIRC;
    progressRing.setAttribute('data-offset', CIRC);
  });

  // init ring offset
  progressRing.style.strokeDasharray = CIRC;
  progressRing.style.strokeDashoffset = CIRC;
  progressRing.setAttribute('data-offset', CIRC);

  // clear errors on input
  [initialInput, finalInput].forEach(i => i.addEventListener('input', () => {
    clearErrors();
  }));

  // allow Escape to reset
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') resetBtn.click();
  });
})();