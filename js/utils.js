(function (global) {
  function mod(n, m) {
    return ((n % m) + m) % m;
  }

  function shuffleInPlace(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
  }

  function sanitizeFileToken(value) {
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  function sanitizeTsv(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/\t/g, " ").replace(/\n/g, " ");
  }

  function round3(value) {
    return Math.round(value * 1000) / 1000;
  }

  function log2(value) {
    return Math.log(value) / Math.log(2);
  }

  function twoDigit(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function timestampTag() {
    var now = new Date();
    return (
      now.getFullYear().toString() +
      twoDigit(now.getMonth() + 1) +
      twoDigit(now.getDate()) +
      "_" +
      twoDigit(now.getHours()) +
      twoDigit(now.getMinutes()) +
      twoDigit(now.getSeconds())
    );
  }

  function distance(ptA, ptB) {
    var dx = ptB[0] - ptA[0];
    var dy = ptB[1] - ptA[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  function clamp(value, minValue, maxValue) {
    return Math.max(minValue, Math.min(maxValue, value));
  }

  function intersectsReservedRect(pt, rad, rect) {
    var clearance = rect.clearance || 0;
    var minX = rect.x - clearance;
    var minY = rect.y - clearance;
    var maxX = rect.x + rect.width + clearance;
    var maxY = rect.y + rect.height + clearance;
    var closestX = clamp(pt[0], minX, maxX);
    var closestY = clamp(pt[1], minY, maxY);
    var dx = pt[0] - closestX;
    var dy = pt[1] - closestY;
    return dx * dx + dy * dy < rad * rad;
  }

  function inReservedArea(pt, rad, reservedRects) {
    for (var i = 0; i < reservedRects.length; i++) {
      if (intersectsReservedRect(pt, rad, reservedRects[i])) return true;
    }
    return false;
  }

  function initTargets(numTargets, minRadius, maxRadius, minSep, w, h, reservedRects) {
    var radRange = maxRadius - minRadius;
    var minX = maxRadius + 10;
    var maxX = w - maxRadius - 10;
    var minY = maxRadius + 10;
    var maxY = h - maxRadius - 10;
    var xRange = maxX - minX;
    var yRange = maxY - minY;
    var blockedRects = reservedRects || [];

    var layoutAttempts = 0;
    while (layoutAttempts < 40) {
      var generated = [];
      var failedLayout = false;

      for (var i = 0; i < numTargets; i++) {
        var placed = false;

        for (var attempt = 0; attempt < 4000; attempt++) {
          var pt = [Math.random() * xRange + minX, Math.random() * yRange + minY];
          var rad = Math.random() * radRange + minRadius;

          if (inReservedArea(pt, rad, blockedRects)) continue;

          var collision = false;
          for (var j = 0; j < generated.length; j++) {
            var ptJ = generated[j][0];
            var radJ = generated[j][1];
            if (distance(pt, ptJ) < rad + radJ + minSep) {
              collision = true;
              break;
            }
          }

          if (!collision) {
            generated.push([pt, rad]);
            placed = true;
            break;
          }
        }

        if (!placed) {
          failedLayout = true;
          break;
        }
      }

      if (!failedLayout) return generated;
      layoutAttempts++;
    }

    return [];
  }

  global.A2Utils = {
    mod: mod,
    shuffleInPlace: shuffleInPlace,
    sanitizeFileToken: sanitizeFileToken,
    sanitizeTsv: sanitizeTsv,
    round3: round3,
    log2: log2,
    twoDigit: twoDigit,
    timestampTag: timestampTag,
    distance: distance,
    initTargets: initTargets,
  };
})(window);
