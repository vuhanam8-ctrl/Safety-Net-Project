(function () {
  const finalMessage = "You saw the addiction. Did you see the person?";
  const failedHeartsRequired = 2;
  const initialDegradationInterval = 4000;
  const minimumDegradationInterval = 300;
  const degradationAcceleration = 0.78;
  const finalGlitchDuration = 2200;
  const glitchPopupInterval = 28;
  const glitchPopupLimit = 56;
  const invasionPopupInterval = 2500;
  const invasionPopupLimit = 15;
  const invasionColors = ["#F7CD26", "#53A643", "#33FF58"];
  const invasionTextStages = [
    "YOU ARE THE 1,000,000TH VISITOR?",
    "CLICK HERE TO CLAIM YOUR FREE GIFT?",
    "CLICK HERE TO CLAIM YOUR ADDICTION?",
    "\u201cI FINALLY SUMMONED UP THE COURAGE TO SAY THREE WORDS THAT WOULD CHANGE MY LIFE: I NEED HELP.\u201d \u2014 ELTON JOHN",
    "YOU SAW THE PRIZE. DID YOU SEE THE PERSON?",
    "YOU SAW THE ADDICTION. DID YOU SEE THE PERSON?"
  ];

  const mutations = [
    [".bbc-placeholder-latest", "LATEST: Public patience wears thin as substance-use cases return"],
    [".lead-story-copy h2", "Support services struggle with people who refuse to change"],
    [".lead-story-copy > p", "Officials question how long communities should keep helping people who repeatedly make the same choices..."],
    [".bbc-side-module:nth-of-type(2) p", "Communities count the cost of people who will not change."],
    [".bbc-side-module:nth-of-type(3) p", "Why should treatment be offered more than once?"],
    [".bbc-side-module:nth-of-type(4) p", "When does a victim become the problem?"],
    [".bbc-placeholder-related", "› Their choices. Their damage. Their fault."]
  ];

  const smallStoryVariations = [
    [".bbc-secondary-stories article:nth-child(1)", "Detroit rapper begins treatment after prescription-drug emergency", "Friends say the entertainer has stepped away from public life to focus on recovery and medical support.", "Controversial MC enters rehab after self-inflicted crisis", "Reports reduce a near-fatal overdose to reckless behaviour while questions about treatment disappear."],
    [".bbc-secondary-stories article:nth-child(2)", "Piano icon reflects on choosing rehabilitation", "The British performer says asking for help in July 1990 allowed him to rebuild his life.", "Veteran performer says recovery is simply a matter of resolve", "A complicated path through treatment is repackaged as proof that people who relapse lack determination."],
    [".bbc-mini-story:nth-child(1)", "Health agencies review response to emerging synthetic substances", "Specialists seek quicker warnings and coordinated medical guidance as risks change.", "Officials blame users as synthetic substances spread", "Institutional gaps receive less attention as coverage centres personal responsibility."],
    [".bbc-mini-story:nth-child(2)", "Community clinics warn waiting lists are growing", "Treatment providers say sustained funding is needed to keep voluntary services accessible.", "Repeat patients blamed for treatment backlog", "Long waits are presented as the fault of people returning for care rather than a shortage of services."],
    [".bbc-mini-story:nth-child(3)", "Recovery mentor kept weekly contact with Detroit performer", "The music legend offered private guidance grounded in his own experience of rehabilitation.", "Private calls between stars fuel fresh gossip", "Recovery support becomes celebrity intrigue while its value to the entertainer is pushed aside."],
    [".bbc-mini-story:nth-child(4)", "Music legend marks another year of sobriety", "The performer recalls that accepting help began a lasting change in his health and relationships.", "Recovered star held up as proof relapse is a choice", "One person's recovery is used to condemn others whose circumstances and treatment needs differ."],
    [".bbc-mini-story:nth-child(5)", "Schools expand lessons on overdose warning signs", "Educators want young people to recognise contamination risks and know when to seek emergency care.", "Teenagers faulted for failing to recognise fentanyl", "Reports stress youthful carelessness while overlooking inconsistent access to harm-reduction information."],
    [".bbc-mini-story:nth-child(6)", "Parents seek guidance after loved ones return from treatment", "Families ask for affordable local services that can support recovery beyond a clinic stay.", "Families accused of prolonging dependency", "Relatives become the target as gaps in continuing community care vanish from the story."],
    [".bbc-mini-story:nth-child(7)", "Press gathers as entertainer leaves private clinic", "Supporters ask photographers to respect his health and privacy during early recovery.", "Camera crews hunt first image after rapper's collapse", "The entertainer's treatment is reduced to a race for scandal and a profitable photograph."],
    [".bbc-mini-story:nth-child(8)", "Clinicians ask editors to protect patient dignity", "Doctors say responsible reporting can encourage treatment instead of deepening shame.", "Doctors' concern buried beneath scandal coverage", "Calls for medical care are reframed as excuses while punishment dominates the headlines."]
  ];

  smallStoryVariations.forEach(function (variation) {
    const story = document.querySelector(variation[0]);
    const useAlternate = Math.random() < 0.5;
    const headingSelector = variation[0] + (story?.querySelector("h2") ? " h2" : " h3");
    const paragraphSelector = variation[0] + " p";

    if (useAlternate && story) {
      story.querySelector("h2, h3").textContent = variation[1];
      story.querySelector("p").textContent = variation[2];
    }

    mutations.push([headingSelector, useAlternate ? variation[3] : getDefaultCorruptedHeading(variation[0])]);
    mutations.push([paragraphSelector, useAlternate ? variation[4] : getDefaultCorruptedParagraph(variation[0])]);
  });

  function getDefaultCorruptedHeading(selector) {
    const defaults = {
      ".bbc-secondary-stories article:nth-child(1)": "Controversial MC's crisis blamed on reckless lifestyle",
      ".bbc-secondary-stories article:nth-child(2)": "Piano icon says discipline separates survivors from failures",
      ".bbc-mini-story:nth-child(1)": "Drug users blamed as emergency rules tighten",
      ".bbc-mini-story:nth-child(2)": "Treatment funding called a waste on repeat cases",
      ".bbc-mini-story:nth-child(3)": "Music legend's advice becomes another celebrity spectacle",
      ".bbc-mini-story:nth-child(4)": "Recovered star used to shame people who relapse",
      ".bbc-mini-story:nth-child(5)": "Young users accused of ignoring obvious risks",
      ".bbc-mini-story:nth-child(6)": "Families told to stop making excuses for addiction",
      ".bbc-mini-story:nth-child(7)": "Celebrity downfall draws crowds outside treatment centre",
      ".bbc-mini-story:nth-child(8)": "Calls for compassion dismissed as being soft on addicts"
    };
    return defaults[selector];
  }

  function getDefaultCorruptedParagraph(selector) {
    const defaults = {
      ".bbc-secondary-stories article:nth-child(1)": "Commentators focus on the entertainer's behaviour while his need for treatment slips from the story.",
      ".bbc-secondary-stories article:nth-child(2)": "A complicated recovery story is reduced to a lesson about willpower and personal weakness.",
      ".bbc-mini-story:nth-child(1)": "Coverage frames the emergency as disorder and blame, leaving treatment needs and policy detail below the fold.",
      ".bbc-mini-story:nth-child(2)": "Critics describe repeat care as indulgence while evidence about continuing recovery is pushed aside.",
      ".bbc-mini-story:nth-child(3)": "Private support becomes gossip, with the entertainer's advice stripped of its recovery context.",
      ".bbc-mini-story:nth-child(4)": "A decades-long recovery is flattened into a moral about discipline and individual strength.",
      ".bbc-mini-story:nth-child(5)": "Reports accuse teenagers of carelessness while access to clear harm-reduction information receives less attention.",
      ".bbc-mini-story:nth-child(6)": "Relatives are blamed for enabling addiction as shortages in affordable local care go unexamined.",
      ".bbc-mini-story:nth-child(7)": "The entertainer's treatment becomes a spectacle, reducing a medical crisis to photographs and scandal.",
      ".bbc-mini-story:nth-child(8)": "Calls for medical care are recast as excuses, shifting attention from treatment to punishment."
    };
    return defaults[selector];
  }

  let failedHeartCount = 0;
  let degradationHasStarted = false;
  let degradationHasFinished = false;
  let glitchAdvertisementHasBeenArmed = false;
  let finalGlitchHasStarted = false;
  let glitchPopupTimer = null;
  let glitchPopupCount = 0;
  let invasionPopupTimer = null;
  let currentInvasionPopups = 0;
  let totalInvasionPopupsClosed = 0;

  function tryArmGlitchAdvertisement() {
    if (glitchAdvertisementHasBeenArmed) return;
    if (failedHeartCount < failedHeartsRequired) return;
    if (!degradationHasFinished) return;

    glitchAdvertisementHasBeenArmed = true;
    window.dispatchEvent(new CustomEvent("amigos-glitch-armed"));
  }

  function mutateElement(selector, replacement, progress) {
    const element = document.querySelector(selector);
    if (!element) return;

    const isHeadline = element.matches("h1, h2, h3, h4, h5, h6, .bbc-placeholder-latest");
    const originalText = element.textContent;

    element.style.animationDuration = Math.round(380 - progress * 220) + "ms";
    element.classList.add("story-corrupting");
    window.setTimeout(function () {
      element.textContent = replacement;
      element.classList.remove("story-corrupting");
      element.classList.add("story-corrupted");
      element.dataset.originalStoryText = originalText;
      element.dataset.corruptedStoryText = replacement;

      if (isHeadline) {
        element.dataset.originalHeadline = originalText;
        element.dataset.corruptedHeadline = replacement;
        element.classList.add("story-corrupted-headline");
      }
    }, Math.round(380 - progress * 220));
  }

  function revealOriginalHeadline(element) {
    if (!element?.dataset.originalHeadline) return;
    if (document.body.classList.contains("final-text-takeover")) return;
    element.textContent = element.dataset.originalHeadline;
    element.classList.add("story-headline-revealed");

    const storyCopy = getRelatedStoryCopy(element);
    if (storyCopy?.dataset.originalStoryText) {
      storyCopy.textContent = storyCopy.dataset.originalStoryText;
      storyCopy.classList.add("story-copy-revealed");
    }
  }

  function restoreCorruptedHeadline(element) {
    if (!element?.dataset.corruptedHeadline) return;
    element.textContent = element.dataset.corruptedHeadline;
    element.classList.remove("story-headline-revealed");

    const storyCopy = getRelatedStoryCopy(element);
    if (storyCopy?.dataset.corruptedStoryText) {
      storyCopy.textContent = storyCopy.dataset.corruptedStoryText;
      storyCopy.classList.remove("story-copy-revealed");
    }
  }

  function getRelatedStoryCopy(headline) {
    if (!headline.matches("h1, h2, h3, h4, h5, h6")) return null;
    const story = headline.closest("article, .lead-story-copy, .bbc-side-module");
    return story?.querySelector("p.story-corrupted") || null;
  }

  let activeHoverHeadline = null;

  document.addEventListener("pointermove", function (event) {
    const nextHeadline = event.target.closest?.(".story-corrupted-headline") || null;
    if (nextHeadline === activeHoverHeadline) return;

    restoreCorruptedHeadline(activeHoverHeadline);
    activeHoverHeadline = nextHeadline;
    revealOriginalHeadline(activeHoverHeadline);
  });

  document.addEventListener("pointerout", function (event) {
    if (event.relatedTarget !== null) return;
    restoreCorruptedHeadline(activeHoverHeadline);
    activeHoverHeadline = null;
  });

  function replacePageWords() {
    const roots = [
      document.querySelector(".topbar"),
      document.querySelector(".amigos-page")
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
    screenLock.addEventListener("click", function () {
      window.dispatchEvent(new CustomEvent("amigos-final-lock-click"));
    });

    const messageWindow = document.createElement("section");
    messageWindow.className = "final-message-window";
    messageWindow.setAttribute("role", "alertdialog");
    messageWindow.setAttribute("aria-modal", "true");
    messageWindow.setAttribute("aria-label", finalMessage);
    messageWindow.innerHTML =
      '<div class="final-message-title"><span>' + finalMessage + '</span><b>×</b></div>' +
      '<div class="final-message-body"><span class="final-message-symbol">!</span><strong>' + finalMessage + '</strong></div>' +
      '<div class="glitch-question-actions final-yes-actions"><button type="button" data-final-answer="yes">Yes</button><span class="missing-no-space" aria-hidden="true"></span></div>';

    messageWindow.querySelector("[data-final-answer='yes']").addEventListener("click", function () {
      window.dispatchEvent(new CustomEvent("amigos-final-yes"));
    });

    document.body.append(screenLock, messageWindow);
  }

  function finishTakeover() {
    if (glitchPopupTimer !== null) {
      window.clearInterval(glitchPopupTimer);
      glitchPopupTimer = null;
    }
    stopGradualInvasion();
    document.querySelectorAll(".glitch-scatter-popup").forEach(function (popup) {
      popup.remove();
    });
    currentInvasionPopups = 0;
    if (typeof window.noLoop === "function") window.noLoop();
    if (typeof window.freezeAmigosAmbient === "function") window.freezeAmigosAmbient();
    replacePageWords();
    document.body.classList.remove("page-glitching");
    document.documentElement.classList.add("final-text-takeover-root");
    document.body.classList.add("final-text-takeover");
    document.body.style.overflow = "hidden";
    showFinalMessageWindow();
    window.dispatchEvent(new CustomEvent("amigos-final-glitch-finished"));
  }

  function addGlitchPopup() {
    if (glitchPopupCount >= glitchPopupLimit) return;

    const popup = document.createElement("section");
    const width = Math.min(360, Math.max(240, window.innerWidth * 0.3));
    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    const maxTop = Math.max(8, window.innerHeight - 142);
    const left = 8 + Math.random() * Math.max(0, maxLeft - 8);
    const top = 8 + Math.random() * Math.max(0, maxTop - 8);

    popup.className = "glitch-scatter-popup glitch-original-popup";
    popup.setAttribute("aria-hidden", "true");
    popup.style.width = width + "px";
    popup.style.left = left + "px";
    popup.style.top = top + "px";
    popup.innerHTML =
      '<div class="final-message-title"><span>' + finalMessage + '</span><b>×</b></div>' +
      '<div class="glitch-original-body"><span class="final-message-symbol">!</span><strong>' + finalMessage + '</strong></div>';

    document.body.appendChild(popup);
    glitchPopupCount++;
  }

  function addGradualInvasionPopup() {
    if (currentInvasionPopups >= invasionPopupLimit) return;

    const popup = document.createElement("section");
    const width = Math.min(250, Math.max(210, window.innerWidth - 16));
    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    const maxTop = Math.max(8, window.innerHeight - 190);
    const textIndex = Math.min(
      Math.floor(totalInvasionPopupsClosed / 2),
      invasionTextStages.length - 1
    );
    const firstColorIndex = Math.floor(Math.random() * invasionColors.length);
    let secondColorIndex = Math.floor(Math.random() * invasionColors.length);
    while (secondColorIndex === firstColorIndex) {
      secondColorIndex = Math.floor(Math.random() * invasionColors.length);
    }

    popup.className = "glitch-scatter-popup glitch-invasion-popup gradual-invasion-popup";
    popup.style.width = width + "px";
    popup.style.left = 8 + Math.random() * Math.max(0, maxLeft - 8) + "px";
    popup.style.top = 8 + Math.random() * Math.max(0, maxTop - 8) + "px";
    popup.style.background =
      "linear-gradient(180deg, " + invasionColors[firstColorIndex] + ", " +
      invasionColors[secondColorIndex] + ")";
    popup.innerHTML =
      '<button class="glitch-invasion-close" type="button" aria-label="Close popup">X</button>' +
      '<div class="glitch-scatter-body"><strong>' + invasionTextStages[textIndex] + '</strong></div>';

    popup.querySelector(".glitch-invasion-close").addEventListener("click", function () {
      popup.remove();
      currentInvasionPopups--;
      totalInvasionPopupsClosed++;
    });

    document.body.appendChild(popup);
    currentInvasionPopups++;
  }

  function startGradualInvasion() {
    if (invasionPopupTimer !== null) return;
    addGradualInvasionPopup();
    invasionPopupTimer = window.setInterval(addGradualInvasionPopup, invasionPopupInterval);
  }

  function stopGradualInvasion() {
    if (invasionPopupTimer === null) return;
    window.clearInterval(invasionPopupTimer);
    invasionPopupTimer = null;
  }

  function beginPopupScatter() {
    addGlitchPopup();
    glitchPopupTimer = window.setInterval(function () {
      addGlitchPopup();
      if (glitchPopupCount >= glitchPopupLimit) {
        window.clearInterval(glitchPopupTimer);
        glitchPopupTimer = null;
      }
    }, glitchPopupInterval);
  }

  function beginFinalGlitch() {
    if (finalGlitchHasStarted) return;
    finalGlitchHasStarted = true;
    stopGradualInvasion();
    window.dispatchEvent(new CustomEvent("amigos-final-glitch-started"));
    document.body.classList.add("page-glitching");
    beginPopupScatter();
    window.setTimeout(finishTakeover, finalGlitchDuration);
  }

  function beginDegradation() {
    if (degradationHasStarted) return;
    degradationHasStarted = true;
    window.dispatchEvent(new CustomEvent("amigos-degradation-started"));
    startGradualInvasion();

    let elapsed = 0;
    let interval = initialDegradationInterval;

    mutations.forEach(function (mutation, index) {
      window.setTimeout(function () {
        mutateElement(mutation[0], mutation[1], index / (mutations.length - 1));
      }, elapsed);

      elapsed += interval;
      interval = Math.max(minimumDegradationInterval, interval * degradationAcceleration);
    });

    window.setTimeout(function () {
      degradationHasFinished = true;
      tryArmGlitchAdvertisement();
    }, elapsed + 400);
  }

  window.addEventListener("amigos-heart-counted", function () {
    failedHeartCount++;

    if (failedHeartCount === 1) {
      beginDegradation();
    }

    tryArmGlitchAdvertisement();
  });

  window.addEventListener("amigos-glitch-requested", function () {
    if (failedHeartCount < failedHeartsRequired) return;
    if (!degradationHasFinished || !glitchAdvertisementHasBeenArmed) return;
    beginFinalGlitch();
  });
})();
