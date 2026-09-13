(function () {
  const finalMessage = "You saw the addiction. Did you see the person?";
  const failedHeartsRequired = 2;
  const initialDegradationInterval = 6500;
  const minimumDegradationInterval = 450;
  const degradationAcceleration = 0.82;
  const finalGlitchDuration = 2200;

  const mutations = [
    [".bbc-placeholder-latest", "LATEST: Public patience wears thin as substance-use cases return"],
    [".lead-story-copy h2", "Support services struggle with people who refuse to change"],
    [".lead-story-copy > p", "Officials question how long communities should keep helping people who repeatedly make the same choices..."],
    [".bbc-secondary-stories article:nth-child(1) h2", "“The Slim Shady” crisis blamed on reckless lifestyle"],
    [".bbc-secondary-stories article:nth-child(1) p", "Commentators focus on the entertainer's behaviour while his need for treatment slips from the story."],
    [".bbc-secondary-stories article:nth-child(2) h2", "Piano icon says discipline separates survivors from failures"],
    [".bbc-secondary-stories article:nth-child(2) p", "A complicated recovery story is reduced to a lesson about willpower and personal weakness."],
    [".bbc-mini-story:nth-child(1) h3", "Drug users blamed as emergency rules tighten"],
    [".bbc-mini-story:nth-child(2) h3", "Treatment funding called a waste on repeat cases"],
    [".bbc-mini-story:nth-child(3) h3", "Music legend's advice becomes another celebrity spectacle"],
    [".bbc-mini-story:nth-child(4) h3", "Recovered star used to shame people who relapse"],
    [".bbc-mini-story:nth-child(5) h3", "Young users accused of ignoring obvious risks"],
    [".bbc-mini-story:nth-child(6) h3", "Families told to stop making excuses for addiction"],
    [".bbc-mini-story:nth-child(7) h3", "Celebrity downfall draws crowds outside treatment centre"],
    [".bbc-mini-story:nth-child(8) h3", "Calls for compassion dismissed as being soft on addicts"],
    [".bbc-side-module:nth-of-type(2) p", "Communities count the cost of people who will not change."],
    [".bbc-side-module:nth-of-type(3) p", "Why should treatment be offered more than once?"],
    [".bbc-side-module:nth-of-type(4) p", "When does a victim become the problem?"],
    [".bbc-placeholder-related", "› Their choices. Their damage. Their fault."]
  ];

  let failedHeartCount = 0;
  let degradationHasStarted = false;

  function mutateElement(selector, replacement, progress) {
    const element = document.querySelector(selector);
    if (!element) return;

    element.style.animationDuration = Math.round(380 - progress * 220) + "ms";
    element.classList.add("story-corrupting");
    window.setTimeout(function () {
      element.textContent = replacement;
      element.classList.remove("story-corrupting");
      element.classList.add("story-corrupted");
    }, Math.round(380 - progress * 220));
  }

  function replacePageWords() {
    const roots = [
      document.querySelector(".topbar"),
      document.querySelector(".amigos-page"),
      document.querySelector(".message-notification")
    ].filter(Boolean);

    for (const root of roots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const textNodes = [];

      while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (!node.nodeValue.trim()) continue;
        if (parent?.closest(".shell-quote small, .amigos-brand, .bbc-placeholder-brand, .topbar-inner > strong, script, style")) continue;
        textNodes.push(node);
      }

      for (const node of textNodes) node.nodeValue = finalMessage;
    }

    for (const input of document.querySelectorAll("input")) {
      input.value = finalMessage;
      input.placeholder = finalMessage;
    }
  }

  function showFinalMessageWindow() {
    const screenLock = document.createElement("div");
    screenLock.className = "final-screen-lock";
    screenLock.setAttribute("aria-hidden", "true");

    const messageWindow = document.createElement("section");
    messageWindow.className = "final-message-window";
    messageWindow.setAttribute("role", "alertdialog");
    messageWindow.setAttribute("aria-modal", "true");
    messageWindow.setAttribute("aria-label", finalMessage);
    messageWindow.innerHTML =
      '<div class="final-message-title"><span>' + finalMessage + '</span><b>×</b></div>' +
      '<div class="final-message-body"><span class="final-message-symbol">!</span><strong>' + finalMessage + '</strong></div>';

    document.body.append(screenLock, messageWindow);
  }

  function finishTakeover() {
    if (typeof window.noLoop === "function") window.noLoop();
    if (typeof window.freezeAmigosAmbient === "function") window.freezeAmigosAmbient();
    replacePageWords();
    document.body.classList.remove("page-glitching");
    document.body.classList.add("final-text-takeover");
    document.body.style.overflow = "hidden";
    showFinalMessageWindow();
  }

  function beginFinalGlitch() {
    document.body.classList.add("page-glitching");
    window.setTimeout(finishTakeover, finalGlitchDuration);
  }

  function beginDegradation() {
    if (degradationHasStarted) return;
    degradationHasStarted = true;

    let elapsed = 0;
    let interval = initialDegradationInterval;

    mutations.forEach(function (mutation, index) {
      window.setTimeout(function () {
        mutateElement(mutation[0], mutation[1], index / (mutations.length - 1));
      }, elapsed);

      elapsed += interval;
      interval = Math.max(minimumDegradationInterval, interval * degradationAcceleration);
    });

    const takeoverDelay = elapsed + 900;
    window.setTimeout(beginFinalGlitch, takeoverDelay);
  }

  window.addEventListener("amigos-heart-failed", function () {
    failedHeartCount++;

    if (failedHeartCount >= failedHeartsRequired) {
      beginDegradation();
    }
  });
})();
