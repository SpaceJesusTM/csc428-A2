(function (global) {
  var defaults = {
    canvasWidth: 960,
    canvasHeight: 500,
    numTargetsPerCondition: 30,
    trialsPerCondition: 10,
    areaRadius: 50,
    sizeLevels: [
      { sizeLevel: "S", radiusPx: 10 },
      { sizeLevel: "M", radiusPx: 16 },
      { sizeLevel: "L", radiusPx: 22 },
    ],
    spacingLevels: [
      { spacingLevel: "TIGHT", minSepPx: 8 },
      { spacingLevel: "MED", minSepPx: 18 },
      { spacingLevel: "LOOSE", minSepPx: 28 },
    ],
  };

  var techniqueOrders = [
    ["BUBBLE", "POINT", "AREA"],
    ["POINT", "AREA", "BUBBLE"],
    ["AREA", "BUBBLE", "POINT"],
  ];

  function getTechniqueOrder(participantNumber) {
    var group = global.A2Utils.mod(participantNumber - 1, 3);
    return {
      order: techniqueOrders[group].slice(),
      groupIndex: group,
    };
  }

  function buildConditions(techniqueOrder, sizeLevels, spacingLevels) {
    var built = [];
    var conditionIndex = 0;

    for (var t = 0; t < techniqueOrder.length; t++) {
      var technique = techniqueOrder[t];
      var withinTechnique = [];

      for (var s = 0; s < sizeLevels.length; s++) {
        for (var p = 0; p < spacingLevels.length; p++) {
          var size = sizeLevels[s];
          var spacing = spacingLevels[p];
          withinTechnique.push({
            technique: technique,
            techniqueOrderIndex: t,
            sizeLevel: size.sizeLevel,
            radiusPx: size.radiusPx,
            spacingLevel: spacing.spacingLevel,
            minSepPx: spacing.minSepPx,
            factorConditionId:
              technique + "_" + size.sizeLevel + "_" + spacing.spacingLevel,
          });
        }
      }

      global.A2Utils.shuffleInPlace(withinTechnique);

      for (var k = 0; k < withinTechnique.length; k++) {
        withinTechnique[k].conditionIndex = conditionIndex;
        withinTechnique[k].blockNumber = conditionIndex + 1;
        withinTechnique[k].techniqueBlockConditionIndex = k;
        built.push(withinTechnique[k]);
        conditionIndex++;
      }
    }

    return built;
  }

  global.A2Config = {
    defaults: defaults,
    techniqueOrders: techniqueOrders,
    getTechniqueOrder: getTechniqueOrder,
    buildConditions: buildConditions,
  };
})(window);
