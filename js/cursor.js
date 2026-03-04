(function (global) {
  var distance = global.A2Utils.distance;

  function updateTargetsFill(svg, currentCapturedTarget, currentClickTarget) {
    svg.selectAll(".targetCircles").attr("fill", function (d, i) {
      var color = "white";
      if (i === currentCapturedTarget) color = "limegreen";
      if (i === currentClickTarget) color = "lightsalmon";
      if (i === currentClickTarget && i === currentCapturedTarget) color = "darkred";
      return color;
    });
  }

  function getTargetCapturedByBubbleCursor(svg, mouse, targets, isStudyRunning) {
    if (!isStudyRunning || targets.length === 0) {
      svg.select(".cursorCircle").attr("cx", mouse[0]).attr("cy", mouse[1]).attr("r", 0);
      svg.select(".cursorMorphCircle").attr("cx", 0).attr("cy", 0).attr("r", 0);
      return -1;
    }

    var mousePt = [mouse[0], mouse[1]];
    var containDists = [];
    var intersectDists = [];
    var currMinIdx = 0;

    for (var idx = 0; idx < targets.length; idx++) {
      var targetPt = targets[idx][0];
      var currDist = distance(mousePt, targetPt);
      var targetRadius = targets[idx][1];
      containDists.push(currDist + targetRadius);
      intersectDists.push(currDist - targetRadius);
      if (intersectDists[idx] < intersectDists[currMinIdx]) currMinIdx = idx;
    }

    var secondMinIdx = (currMinIdx + 1) % targets.length;
    for (idx = 0; idx < targets.length; idx++) {
      if (idx !== currMinIdx && intersectDists[idx] < intersectDists[secondMinIdx]) {
        secondMinIdx = idx;
      }
    }

    var cursorRadius = Math.min(containDists[currMinIdx], intersectDists[secondMinIdx]);

    svg
      .select(".cursorCircle")
      .attr("cx", mouse[0])
      .attr("cy", mouse[1])
      .attr("r", cursorRadius)
      .attr("fill", "lightgray");

    if (cursorRadius < containDists[currMinIdx]) {
      svg
        .select(".cursorMorphCircle")
        .attr("cx", targets[currMinIdx][0][0])
        .attr("cy", targets[currMinIdx][0][1])
        .attr("r", targets[currMinIdx][1] + 5);
    } else {
      svg.select(".cursorMorphCircle").attr("cx", 0).attr("cy", 0).attr("r", 0);
    }

    return currMinIdx;
  }

  function getTargetCapturedByPointCursor(svg, mouse, targets) {
    var mousePt = [mouse[0], mouse[1]];
    var capturedIdx = -1;

    for (var idx = 0; idx < targets.length; idx++) {
      var targetPt = targets[idx][0];
      var targetRadius = targets[idx][1];
      if (distance(mousePt, targetPt) <= targetRadius) capturedIdx = idx;
    }

    svg.select(".cursorCircle").attr("cx", mouse[0]).attr("cy", mouse[1]).attr("r", 0);
    svg.select(".cursorMorphCircle").attr("cx", 0).attr("cy", 0).attr("r", 0);

    return capturedIdx;
  }

  function getTargetCapturedByAreaCursor(svg, mouse, targets, isStudyRunning, areaRadius) {
    var mousePt = [mouse[0], mouse[1]];
    var capturedAreaIdx = -1;
    var capturedPointIdx = -1;
    var numCaptured = 0;

    for (var idx = 0; idx < targets.length; idx++) {
      var targetPt = targets[idx][0];
      var targetRadius = targets[idx][1];
      var currDist = distance(mousePt, targetPt);

      if (currDist <= targetRadius + areaRadius) {
        capturedAreaIdx = idx;
        numCaptured++;
      }

      if (currDist <= targetRadius) capturedPointIdx = idx;
    }

    var capturedIdx = -1;
    if (capturedPointIdx > -1) capturedIdx = capturedPointIdx;
    else if (numCaptured === 1) capturedIdx = capturedAreaIdx;

    var drawRadius = isStudyRunning ? areaRadius : 0;
    svg
      .select(".cursorCircle")
      .attr("cx", mouse[0])
      .attr("cy", mouse[1])
      .attr("r", drawRadius)
      .attr("fill", "lightgray");

    svg.select(".cursorMorphCircle").attr("cx", 0).attr("cy", 0).attr("r", 0);

    return capturedIdx;
  }

  function getCapturedTargetByTechnique(
    svg,
    technique,
    mouse,
    targets,
    isStudyRunning,
    areaRadius
  ) {
    if (technique === "BUBBLE") {
      return getTargetCapturedByBubbleCursor(svg, mouse, targets, isStudyRunning);
    }

    if (technique === "AREA") {
      return getTargetCapturedByAreaCursor(
        svg,
        mouse,
        targets,
        isStudyRunning,
        areaRadius
      );
    }

    return getTargetCapturedByPointCursor(svg, mouse, targets);
  }

  global.A2Cursor = {
    updateTargetsFill: updateTargetsFill,
    getCapturedTargetByTechnique: getCapturedTargetByTechnique,
  };
})(window);
