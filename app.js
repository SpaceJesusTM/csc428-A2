(function (global) {
  function getParticipantInfo() {
    var participantInput = prompt("Enter participant ID (e.g., 1, 2, 3):", "");
    if (participantInput === null) participantInput = "unknown";
    participantInput = participantInput.trim();
    if (participantInput.length === 0) participantInput = "unknown";

    var participantNumber = parseInt(participantInput, 10);
    if (isNaN(participantNumber)) participantNumber = 1;

    return {
      participantId: participantInput,
      participantSlug: global.A2Utils.sanitizeFileToken(participantInput),
      participantNumber: participantNumber,
    };
  }

  function bootstrapStudy() {
    var config = global.A2Config.defaults;
    var participantInfo = getParticipantInfo();

    var orderConfig = global.A2Config.getTechniqueOrder(participantInfo.participantNumber);
    var techniqueOrder = orderConfig.order;
    var participantOrderGroup = orderConfig.groupIndex;

    var conditions = global.A2Config.buildConditions(
      techniqueOrder,
      config.sizeLevels,
      config.spacingLevels
    );

    var runStartIso = new Date().toISOString();
    var sessionTag = global.A2Utils.timestampTag();
    var logger = global.A2Logger.createLogger();

    global.A2StudyRunner.createStudyRunner({
      containerSelector: "#bubbleCursor",
      statusSelector: "#studyStatus",
      participantId: participantInfo.participantId,
      participantSlug: participantInfo.participantSlug,
      participantOrderGroup: participantOrderGroup,
      techniqueOrder: techniqueOrder,
      conditions: conditions,
      runStartIso: runStartIso,
      sessionTag: sessionTag,
      logger: logger,
      config: config,
    });
  }

  bootstrapStudy();
})(window);
