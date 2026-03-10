(function () {
  const timerMinutesInput = document.getElementById("timerMinutes");
  const timerSecondsInput = document.getElementById("timerSeconds");
  const showImmediatelyCheck = document.getElementById("showImmediately");
  const commonCheck = document.getElementById("common");
  const uncommonCheck = document.getElementById("uncommon");
  const rareCheck = document.getElementById("rare");
  const infiniteCheck = document.getElementById("infinite");
  const repeatCountInput = document.getElementById("repeatCount");
  const repeatTimesWrap = document.getElementById("repeat-times-wrap");
  const toggleBtn = document.getElementById("toggle");
  const wordEl = document.getElementById("word");
  const statusEl = document.getElementById("status");

  function getPlaceholder() {
    return wordEl.getAttribute("data-placeholder") || "—";
  }
  const timeLeftWrap = document.getElementById("timeLeftWrap");
  const progressFill = document.getElementById("progressFill");
  const timeLeftText = document.getElementById("timeLeftText");

  let timerId = null;
  let countdownId = null;
  let roundsLeft = 0;
  let isInfinite = true;
  let roundEndTime = 0;
  let roundDurationMs = 0;

  infiniteCheck.addEventListener("change", function () {
    isInfinite = infiniteCheck.checked;
    repeatTimesWrap.classList.toggle("hidden", isInfinite);
  });

  repeatTimesWrap.classList.toggle("hidden", infiniteCheck.checked);

  function isWordTypeActive(btn) {
    return btn.classList.contains("active");
  }

  function getSelectedWords() {
    const list = [];
    if (isWordTypeActive(commonCheck)) list.push(...COMMON_WORDS);
    if (isWordTypeActive(uncommonCheck)) list.push(...UNCOMMON_WORDS);
    if (isWordTypeActive(rareCheck)) list.push(...RARE_WORDS);
    return list;
  }

  [commonCheck, uncommonCheck, rareCheck].forEach(function (btn) {
    btn.addEventListener("click", function () {
      const activeCount = [commonCheck, uncommonCheck, rareCheck].filter(isWordTypeActive).length;
      if (btn.classList.contains("active") && activeCount <= 1) return;
      btn.classList.toggle("active");
    });
  });

  function pickWord() {
    const words = getSelectedWords();
    if (words.length === 0) return null;
    return words[Math.floor(Math.random() * words.length)];
  }

  function speak(word) {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(word);
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  function showWord() {
    const word = pickWord();
    if (!word) {
      statusEl.textContent = "Select at least one word type.";
      return;
    }
    wordEl.textContent = word;
    wordEl.classList.remove("placeholder");
    speak(word);

    if (!isInfinite) {
      roundsLeft--;
      statusEl.textContent = roundsLeft > 0 ? roundsLeft + " round(s) left" : "Done.";
      if (roundsLeft <= 0) {
        stop();
      }
    } else {
      statusEl.textContent = "";
    }
  }

  function getDurationMs() {
    const min = Math.max(0, parseInt(timerMinutesInput.value, 10) || 0);
    const sec = Math.max(0, Math.min(59, parseInt(timerSecondsInput.value, 10) || 0));
    const totalSec = min * 60 + sec;
    return totalSec < 1 ? 1000 : totalSec * 1000;
  }

  function updateTimeLeft() {
    if (!roundEndTime) return;
    const left = Math.max(0, roundEndTime - Date.now());
    const pct = roundDurationMs > 0 ? left / roundDurationMs : 0;
    progressFill.style.transform = "scaleX(" + pct + ")";
    const sec = Math.ceil(left / 1000);
    timeLeftText.textContent = sec > 0 ? sec + "s left" : "";
    if (left <= 0 && countdownId) {
      clearInterval(countdownId);
      countdownId = null;
    }
  }

  function startCountdown(ms) {
    roundDurationMs = ms;
    roundEndTime = Date.now() + ms;
    if (countdownId) clearInterval(countdownId);
    countdownId = setInterval(updateTimeLeft, 100);
    updateTimeLeft();
  }

  function runRound() {
    showWord();
    if (timerId === null) return;
    if (!isInfinite && roundsLeft <= 0) return;
    const ms = getDurationMs();
    startCountdown(ms);
    timerId = setTimeout(runRound, ms);
  }

  function start() {
    const words = getSelectedWords();
    if (words.length === 0) {
      statusEl.textContent = "Select at least one word type.";
      return;
    }

    isInfinite = infiniteCheck.checked;
    if (!isInfinite) {
      roundsLeft = Math.max(1, Math.floor(Number(repeatCountInput.value)) || 1);
      repeatCountInput.value = roundsLeft;
    }

    wordEl.textContent = getPlaceholder();
    wordEl.classList.add("placeholder");
    statusEl.textContent = "";
    toggleBtn.textContent = "Stop";
    timeLeftWrap.classList.add("visible");

    if (showImmediatelyCheck.checked) {
      showWord();
      if (!isInfinite && roundsLeft <= 0) return;
    } else {
      progressFill.style.transform = "scaleX(1)";
      timeLeftText.textContent = "";
    }

    const ms = getDurationMs();
    startCountdown(ms);
    timerId = setTimeout(runRound, ms);
  }

  function stop() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (countdownId !== null) {
      clearInterval(countdownId);
      countdownId = null;
    }
    roundEndTime = 0;
    timeLeftWrap.classList.remove("visible");
    progressFill.style.transform = "";
    timeLeftText.textContent = "";
    wordEl.textContent = getPlaceholder();
    wordEl.classList.add("placeholder");
    toggleBtn.textContent = "Start";
    if (!wordEl.textContent) statusEl.textContent = "Stopped.";
  }

  toggleBtn.addEventListener("click", function () {
    if (timerId !== null) stop();
    else start();
  });
})();
