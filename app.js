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
  const minWordLengthInput = document.getElementById("minWordLength");
  var posCheckboxEls = document.querySelectorAll(".pos-checkboxes input[type=\"checkbox\"]");
  var soloBtns = document.querySelectorAll(".pos-checkboxes .solo-btn");

  let COMMON_WORDS = [];
  let UNCOMMON_WORDS = [];
  let RARE_WORDS = [];

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
  let wordsLoaded = false;

  fetch("google-10000-english-no-swears.txt")
    .then(function (r) { return r.text(); })
    .then(function (text) {
      var all = text.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
      COMMON_WORDS = all.slice(100, 500);
      UNCOMMON_WORDS = all.slice(500, 3000);
      RARE_WORDS = all.slice(3000);
      wordsLoaded = true;
      setStatusMessage("", false);
      toggleBtn.disabled = false;
    })
    .catch(function () {
      setStatusMessage("Could not load words.", true);
    });

  statusEl.textContent = "Loading words…";
  toggleBtn.disabled = true;

  infiniteCheck.addEventListener("change", function () {
    isInfinite = infiniteCheck.checked;
    repeatTimesWrap.classList.toggle("hidden", isInfinite);
  });

  repeatTimesWrap.classList.toggle("hidden", infiniteCheck.checked);

  function setStatusMessage(text, isError) {
    statusEl.textContent = text;
    statusEl.classList.toggle("error", !!isError);
  }

  function getMinLength() {
    const n = parseInt(minWordLengthInput.value, 10);
    return isNaN(n) || n < 1 ? 3 : n;
  }

  [].forEach.call(posCheckboxEls, function (cb) {
    cb.addEventListener("click", function () {
      var soloCount = [].filter.call(soloBtns, function (b) { return b.classList.contains("solo-active"); }).length;
      if (soloCount > 0) return;
      var checkedCount = [].filter.call(posCheckboxEls, function (c) { return c.checked; }).length;
      if (checkedCount === 0) this.checked = true;
    });
  });

  [].forEach.call(soloBtns, function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      this.classList.toggle("solo-active");
    });
  });

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
      btn.classList.toggle("active");
    });
  });

  function getSelectedPosTags() {
    var tags = [];
    var activeSolos = [].filter.call(soloBtns, function (b) { return b.classList.contains("solo-active"); });
    if (activeSolos.length > 0) {
      activeSolos.forEach(function (b) {
        var t = b.getAttribute("data-tags");
        if (t) t.split(",").forEach(function (x) { tags.push(x.trim()); });
      });
      return tags;
    }
    [].forEach.call(posCheckboxEls, function (cb) {
      if (cb.checked && cb.getAttribute("data-tags")) {
        cb.getAttribute("data-tags").split(",").forEach(function (t) { tags.push(t.trim()); });
      }
    });
    return tags;
  }

  function isTagInSelected(tag) {
    var selected = getSelectedPosTags();
    return selected.length === 0 || selected.indexOf(tag) !== -1;
  }

  function getWordTag(word) {
    if (window.pos && window.pos.Lexer && window.pos.Tagger) {
      try {
        var lexer = new window.pos.Lexer();
        var tagger = new window.pos.Tagger();
        var tokens = lexer.lex(word);
        var tagged = tagger.tag(tokens);
        if (tagged[0] && tagged[0][1]) return tagged[0][1];
      } catch (e) {}
    }
    return (typeof window.POS_Tagger !== "undefined" && window.POS_Tagger.tagWord)
      ? window.POS_Tagger.tagWord(word) : "NN";
  }

  function isIncludedByPos(word) {
    return isTagInSelected(getWordTag(word));
  }

  function anyPosChecked() {
    var anySolo = [].some.call(soloBtns, function (b) { return b.classList.contains("solo-active"); });
    if (anySolo) return true;
    return [].some.call(posCheckboxEls, function (c) { return c.checked; });
  }

  function getAllowedWords() {
    var words = getSelectedWords();
    var minLen = getMinLength();
    var filtered = words.filter(function (w) { return w.length >= minLen; });
    if (!anyPosChecked()) return filtered;
    return filtered.filter(function (w) { return isIncludedByPos(w); });
  }

  function pickWord() {
    const allowed = getAllowedWords();
    if (allowed.length === 0) return null;
    return allowed[Math.floor(Math.random() * allowed.length)];
  }

  function speak(word) {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(word);
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  function scaleWordToFit() {
    if (wordEl.classList.contains("placeholder")) return;
    wordEl.style.fontSize = "";
    var maxWidth = wordEl.clientWidth;
    var size = Math.floor(parseFloat(getComputedStyle(wordEl).fontSize));
    wordEl.style.fontSize = size + "px";
    while (wordEl.scrollWidth > maxWidth && size > 12) {
      size -= 2;
      wordEl.style.fontSize = size + "px";
    }
  }

  function getNoWordErrorMessage() {
    if (getSelectedWords().length === 0) return "Select at least one word type.";
    if (!anyPosChecked()) return "Select at least one part of speech.";
    return "No words match the selected filters.";
  }

  function showWord() {
    const word = pickWord();
    if (!word) {
      setStatusMessage(getNoWordErrorMessage(), true);
      return;
    }
    wordEl.textContent = word;
    wordEl.classList.remove("placeholder");
    requestAnimationFrame(function () { requestAnimationFrame(scaleWordToFit); });
    speak(word);

    if (!isInfinite) {
      roundsLeft--;
      setStatusMessage(roundsLeft > 0 ? roundsLeft + " round(s) left" : "Done.", false);
      if (roundsLeft <= 0) {
        stop();
      }
    } else {
      setStatusMessage("", false);
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
      setStatusMessage("Select at least one word type.", true);
      return;
    }
    if (!anyPosChecked()) {
      setStatusMessage("Select at least one part of speech.", true);
      return;
    }
    if (getAllowedWords().length === 0) {
      setStatusMessage("No words match the selected filters.", true);
      return;
    }

    isInfinite = infiniteCheck.checked;
    if (!isInfinite) {
      roundsLeft = Math.max(1, Math.floor(Number(repeatCountInput.value)) || 1);
      repeatCountInput.value = roundsLeft;
    }

    wordEl.textContent = getPlaceholder();
    wordEl.classList.add("placeholder");
    wordEl.style.fontSize = "";
    setStatusMessage("", false);
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
    wordEl.style.fontSize = "";
    toggleBtn.textContent = "Start";
    setStatusMessage("Stopped.", false);
  }

  toggleBtn.addEventListener("click", function () {
    if (timerId !== null) stop();
    else start();
  });
})();
