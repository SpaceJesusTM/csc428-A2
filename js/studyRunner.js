(function (global) {
  var round3 = global.A2Utils.round3;
  var distance = global.A2Utils.distance;
  var log2 = global.A2Utils.log2;
  var initTargets = global.A2Utils.initTargets;

  function createStudyRunner(options) {
    var participantId = options.participantId;
    var participantSlug = options.participantSlug;
    var participantOrderGroup = options.participantOrderGroup;
    var techniqueOrder = options.techniqueOrder;
    var conditions = options.conditions;
    var runStartIso = options.runStartIso;
    var sessionTag = options.sessionTag;
    var logger = options.logger;
    var statusSelector = options.statusSelector;

    var config = options.config;
    var w = config.canvasWidth;
    var h = config.canvasHeight;
    var numTargetsPerCondition = config.numTargetsPerCondition;
    var trialsPerCondition = config.trialsPerCondition;
    var areaRadius = config.areaRadius;

    var studyState = "rest"; // rest | running | complete
    var isStudyRunning = false;

    var conditionCursor = -1;
    var currentCondition = null;
    var targets = [];
    var clickTarget = -1;

    var trialInBlock = 0;
    var globalTrialNumber = 0;
    var trialStartTimestampMs = 0;
    var wrongTargetClicks = 0;
    var missClicks = 0;
    var pathLengthPx = 0;
    var lastMousePos = null;

    var previousGoal = [w / 2, h / 2];
    var trialGoalX = 0;
    var trialGoalY = 0;
    var trialPrevGoalX = 0;
    var trialPrevGoalY = 0;
    var trialA = 0;
    var trialW = 0;
    var trialID = 0;
    var counterRect = {
      x: w - 214,
      y: 8,
      width: 202,
      height: 34,
      clearance: 10,
    };

    var svg = createSvg();
    var statusPanel = d3.select(statusSelector);

    function createSvg() {
      var built = d3
        .select(options.containerSelector)
        .append("svg:svg")
        .attr("width", w)
        .attr("height", h);

      built
        .append("rect")
        .attr("class", "backgroundRect")
        .attr("width", w)
        .attr("height", h)
        .attr("fill", "white")
        .attr("stroke", "black");

      built
        .append("circle")
        .attr("class", "cursorCircle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 0)
        .attr("fill", "lightgray")
        .style("visibility", "hidden");

      built
        .append("circle")
        .attr("class", "cursorMorphCircle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 0)
        .attr("fill", "lightgray")
        .style("visibility", "hidden");

      built
        .append("text")
        .attr("class", "canvasPromptText1")
        .attr("x", w / 2)
        .attr("y", h / 2 - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "32px")
        .style("font-weight", "700")
        .style("fill", "#333")
        .style("visibility", "hidden");

      built
        .append("text")
        .attr("class", "canvasPromptText2")
        .attr("x", w / 2)
        .attr("y", h / 2 + 26)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("fill", "#555")
        .style("visibility", "hidden");

      built
        .append("rect")
        .attr("class", "canvasTrialCounterBg")
        .attr("x", counterRect.x)
        .attr("y", counterRect.y)
        .attr("width", counterRect.width)
        .attr("height", counterRect.height)
        .attr("rx", 6)
        .attr("ry", 6)
        .attr("fill", "#ffffff")
        .attr("stroke", "#8a8a8a");

      built
        .append("text")
        .attr("class", "canvasTrialCounterText")
        .attr("x", w - 18)
        .attr("y", counterRect.y + 23)
        .attr("text-anchor", "end")
        .style("font-size", "18px")
        .style("font-weight", "700")
        .style("fill", "#111")
        .text("Trial Progress: 0/" + trialsPerCondition);

      return built;
    }

    function setStatusText(text1, text2, text3, text4) {
      if (!statusPanel.empty()) {
        statusPanel.select(".statusLine1").text(text1 || "");
        statusPanel.select(".statusLine2").text(text2 || "");
        statusPanel.select(".statusLine3").text(text3 || "");
        statusPanel.select(".statusLine4").text(text4 || "");
      }
    }

    function setTrialCounterText(text) {
      svg.select(".canvasTrialCounterText").text(text || "");
    }

    function setCanvasPrompt(visible, text1, text2) {
      var visibility = visible ? "visible" : "hidden";
      svg.select(".canvasPromptText1").style("visibility", visibility).text(text1 || "");
      svg.select(".canvasPromptText2").style("visibility", visibility).text(text2 || "");
    }

    function setCursorVisibility(visible) {
      var visibility = visible ? "visible" : "hidden";
      svg.select(".cursorCircle").style("visibility", visibility);
      svg.select(".cursorMorphCircle").style("visibility", visibility);

      if (!visible) {
        svg.select(".cursorCircle").attr("r", 0);
        svg.select(".cursorMorphCircle").attr("r", 0);
      }
    }

    function clearTargets() {
      svg.selectAll(".targetCircles").remove();
      targets = [];
      clickTarget = -1;
    }

    function renderTargets() {
      var circles = svg.selectAll(".targetCircles").data(targets);

      circles
        .enter()
        .append("circle")
        .attr("class", "targetCircles")
        .attr("stroke-width", 2)
        .attr("stroke", "limegreen");

      circles
        .attr("cx", function (d) {
          return d[0][0];
        })
        .attr("cy", function (d) {
          return d[0][1];
        })
        .attr("r", function (d) {
          return d[1] - 1;
        })
        .attr("fill", "white");

      circles.exit().remove();
    }

    function getCapturedTargetByTechnique(mouse) {
      if (!currentCondition) return -1;

      return global.A2Cursor.getCapturedTargetByTechnique(
        svg,
        currentCondition.technique,
        mouse,
        targets,
        isStudyRunning,
        areaRadius
      );
    }

    function logEvent(eventType, x, y, capturedTargetId, isGoalSelection) {
      var conditionIndex = "";
      var blockNumber = "";
      var technique = "";
      var sizeLevel = "";
      var spacingLevel = "";

      if (currentCondition) {
        conditionIndex = currentCondition.conditionIndex;
        blockNumber = currentCondition.blockNumber;
        technique = currentCondition.technique;
        sizeLevel = currentCondition.sizeLevel;
        spacingLevel = currentCondition.spacingLevel;
      }

      logger.appendEventRow([
        participantId,
        Date.now(),
        eventType,
        studyState,
        conditionIndex,
        blockNumber,
        trialInBlock,
        globalTrialNumber,
        technique,
        sizeLevel,
        spacingLevel,
        x,
        y,
        capturedTargetId,
        clickTarget,
        isGoalSelection,
        wrongTargetClicks,
        missClicks,
        round3(pathLengthPx),
      ]);
    }

    function getTechniqueBriefing(technique) {
      if (technique === "POINT") {
        return {
          line1:
            "POINT: selection happens only when the cursor point is inside the target.",
          line2:
            "There is no area assistance. Move the pointer tip into the target circle to select.",
        };
      }

      if (technique === "AREA") {
        return {
          line1:
            "AREA: the gray cursor area can assist selection when exactly one target is inside it.",
          line2:
            "If the center point is inside a target, it behaves like point selection for that target.",
        };
      }

      return {
        line1:
          "BUBBLE: the cursor bubble resizes dynamically to capture the nearest target.",
        line2:
          "Move toward the intended target and click when it is the captured selection.",
      };
    }

    function showRestScreen(isFirstScreen) {
      studyState = "rest";
      isStudyRunning = false;
      clearTargets();
      setCursorVisibility(false);
      setTrialCounterText("Trial Progress: 0/" + trialsPerCondition);

      var nextCondition = conditions[conditionCursor + 1];
      if (!nextCondition) return;

      var orderLabel = techniqueOrder.join(" -> ");
      var isTechniqueTransition = nextCondition.techniqueBlockConditionIndex === 0;
      var briefing = getTechniqueBriefing(nextCondition.technique);

      if (isFirstScreen) {
        if (isTechniqueTransition) {
          setStatusText(
            "Welcome. Read instructions before starting.",
            "Participant " +
              participantId +
              " | Technique order: " +
              orderLabel +
              " | Group " +
              (participantOrderGroup + 1),
            briefing.line1,
            briefing.line2
          );
        } else {
          setStatusText(
            "Welcome. Read the instructions below before starting.",
            "Participant " +
              participantId +
              " | Technique order: " +
              orderLabel +
              " | Group " +
              (participantOrderGroup + 1),
            "You will complete " +
              conditions.length +
              " conditions, each with " +
              trialsPerCondition +
              " trials.",
            "Click when ready. Timing starts after you begin each condition."
          );
        }
        setCanvasPrompt(
          true,
          "Click Here When Ready",
          "Start " +
            nextCondition.technique +
            " tasks (condition " +
            (nextCondition.conditionIndex + 1) +
            " of " +
            conditions.length +
            ")"
        );
      } else {
        if (isTechniqueTransition) {
          setStatusText(
            "New cursor technique: " + nextCondition.technique,
            briefing.line1,
            briefing.line2,
            "Click when ready to begin this technique block."
          );
        } else {
          setStatusText(
            "Condition complete. Take a short rest.",
            "Next: condition " +
              (nextCondition.conditionIndex + 1) +
              " / " +
              conditions.length +
              " (" +
              nextCondition.technique +
              ", size " +
              nextCondition.sizeLevel +
              ", spacing " +
              nextCondition.spacingLevel +
              ")",
            "Each condition has " + trialsPerCondition + " trials.",
            "Click when ready to continue."
          );
        }
        setCanvasPrompt(
          true,
          "Click Here When Ready",
          isTechniqueTransition
            ? "Begin " + nextCondition.technique + " tasks"
            : "Begin condition " +
              (nextCondition.conditionIndex + 1) +
              " of " +
              conditions.length
        );
      }

      logEvent(isFirstScreen ? "intro_screen" : "rest_screen", "", "", "", "");
    }

    function updateRunningStatus() {
      setStatusText(
        "Condition " +
          (currentCondition.conditionIndex + 1) +
          " / " +
          conditions.length +
          ": " +
          currentCondition.technique +
          " | size " +
          currentCondition.sizeLevel +
          " (" +
          currentCondition.radiusPx +
          "px) | spacing " +
          currentCondition.spacingLevel +
          " (" +
          currentCondition.minSepPx +
          "px)",
        "Trial " +
          trialInBlock +
          " / " +
          trialsPerCondition +
          " in this condition | Global trial " +
          globalTrialNumber,
        "Click the salmon target. Trial ends on the first correct click.",
        "Wrong-target clicks: " + wrongTargetClicks + " | Miss clicks: " + missClicks
      );
      setTrialCounterText("Trial Progress: " + trialInBlock + "/" + trialsPerCondition);
    }

    function pickNextTarget(previousTarget) {
      var newTarget = Math.floor(Math.random() * targets.length);
      if (targets.length > 1) {
        while (newTarget === previousTarget) {
          newTarget = Math.floor(Math.random() * targets.length);
        }
      }
      return newTarget;
    }

    function startTrial() {
      trialInBlock++;
      globalTrialNumber++;

      clickTarget = pickNextTarget(clickTarget);

      trialGoalX = targets[clickTarget][0][0];
      trialGoalY = targets[clickTarget][0][1];
      trialPrevGoalX = previousGoal[0];
      trialPrevGoalY = previousGoal[1];

      trialA = distance([trialPrevGoalX, trialPrevGoalY], [trialGoalX, trialGoalY]);
      trialW = currentCondition.radiusPx * 2;
      trialID = trialW > 0 ? log2(trialA / trialW + 1) : 0;

      trialStartTimestampMs = Date.now();
      wrongTargetClicks = 0;
      missClicks = 0;
      pathLengthPx = 0;
      lastMousePos = null;

      global.A2Cursor.updateTargetsFill(svg, -1, clickTarget);
      updateRunningStatus();
      logEvent("trial_start", "", "", "", "");
    }

    function endTrial(mouse, capturedTargetIdx) {
      var trialEndTimestampMs = Date.now();
      var timeMs = trialEndTimestampMs - trialStartTimestampMs;
      var mtSec = timeMs / 1000;
      var throughput = mtSec > 0 ? trialID / mtSec : 0;
      var totalErrors = wrongTargetClicks + missClicks;

      logger.appendTrialRow([
        participantId,
        participantOrderGroup + 1,
        runStartIso,
        sessionTag,
        currentCondition.conditionIndex,
        currentCondition.factorConditionId,
        currentCondition.blockNumber,
        currentCondition.technique,
        currentCondition.techniqueOrderIndex,
        currentCondition.techniqueBlockConditionIndex,
        currentCondition.sizeLevel,
        currentCondition.radiusPx,
        currentCondition.spacingLevel,
        currentCondition.minSepPx,
        numTargetsPerCondition,
        w,
        h,
        trialInBlock,
        globalTrialNumber,
        clickTarget,
        round3(trialGoalX),
        round3(trialGoalY),
        round3(trialPrevGoalX),
        round3(trialPrevGoalY),
        round3(trialA),
        round3(trialW),
        round3(trialID),
        timeMs,
        wrongTargetClicks,
        missClicks,
        totalErrors,
        round3(pathLengthPx),
        round3(throughput),
        trialStartTimestampMs,
        trialEndTimestampMs,
        round3(mouse[0]),
        round3(mouse[1]),
        capturedTargetIdx,
      ]);

      logEvent("trial_success", round3(mouse[0]), round3(mouse[1]), capturedTargetIdx, 1);

      previousGoal = [trialGoalX, trialGoalY];

      if (trialInBlock >= trialsPerCondition) {
        endCondition();
      } else {
        startTrial();
      }
    }

    function startNextCondition() {
      conditionCursor++;
      if (conditionCursor >= conditions.length) {
        finishStudy();
        return;
      }

      currentCondition = conditions[conditionCursor];

      targets = initTargets(
        numTargetsPerCondition,
        currentCondition.radiusPx,
        currentCondition.radiusPx,
        currentCondition.minSepPx,
        w,
        h,
        [counterRect]
      );

      if (targets.length !== numTargetsPerCondition) {
        alert(
          "Could not place targets for condition " +
            (currentCondition.conditionIndex + 1) +
            ". Try reducing target count or spacing levels."
        );
        finishStudy();
        return;
      }

      renderTargets();
      setCursorVisibility(true);
      setCanvasPrompt(false, "", "");

      studyState = "running";
      isStudyRunning = true;

      trialInBlock = 0;
      clickTarget = -1;
      previousGoal = [w / 2, h / 2];

      logEvent("condition_start", "", "", "", "");
      startTrial();
    }

    function endCondition() {
      logEvent("condition_end", "", "", "", "");

      isStudyRunning = false;
      clearTargets();
      setCursorVisibility(false);

      if (conditionCursor >= conditions.length - 1) {
        finishStudy();
      } else {
        showRestScreen(false);
      }
    }

    function finishStudy() {
      studyState = "complete";
      isStudyRunning = false;
      clearTargets();
      setCursorVisibility(false);

      logEvent("study_complete", "", "", "", "");

      var exported = logger.exportFiles(participantSlug, sessionTag);

      setStatusText(
        "Study complete.",
        "Downloaded: " + exported.trialFilename,
        "Downloaded: " + exported.eventFilename,
        "Total trials logged: " + exported.trialCount
      );
      setTrialCounterText("Trial Progress: " + trialsPerCondition + "/" + trialsPerCondition);
      setCanvasPrompt(true, "Study Complete", "Data files downloaded");
    }

    function handleMouseMove(mouse) {
      if (studyState !== "running" || !isStudyRunning) return;

      if (lastMousePos) {
        pathLengthPx += distance(lastMousePos, mouse);
      }
      lastMousePos = [mouse[0], mouse[1]];

      var capturedTargetIdx = getCapturedTargetByTechnique(mouse);
      global.A2Cursor.updateTargetsFill(svg, capturedTargetIdx, clickTarget);
    }

    function handleClick(mouse) {
      if (studyState === "rest") {
        startNextCondition();
        return;
      }

      if (studyState !== "running" || !isStudyRunning) return;

      var capturedTargetIdx = getCapturedTargetByTechnique(mouse);
      global.A2Cursor.updateTargetsFill(svg, capturedTargetIdx, clickTarget);

      if (capturedTargetIdx === clickTarget) {
        endTrial(mouse, capturedTargetIdx);
        return;
      }

      if (capturedTargetIdx === -1) {
        missClicks++;
      } else {
        wrongTargetClicks++;
      }

      updateRunningStatus();
      logEvent(
        "trial_error_click",
        round3(mouse[0]),
        round3(mouse[1]),
        capturedTargetIdx,
        0
      );
    }

    svg.on("mousemove", function () {
      handleMouseMove(d3.mouse(this));
    });

    svg.on("click", function () {
      handleClick(d3.mouse(this));
    });

    showRestScreen(true);

    return {
      svg: svg,
    };
  }

  global.A2StudyRunner = {
    createStudyRunner: createStudyRunner,
  };
})(window);
