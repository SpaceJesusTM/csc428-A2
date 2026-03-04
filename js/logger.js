(function (global) {
  var sanitizeTsv = global.A2Utils.sanitizeTsv;

  var trialLogHeader = [
    "participant_id",
    "participant_order_group",
    "run_start_iso",
    "session_tag",
    "condition_index",
    "factor_condition_id",
    "block_number",
    "technique",
    "technique_order_index",
    "technique_block_condition_index",
    "size_level",
    "radius_px",
    "spacing_level",
    "min_sep_px",
    "num_targets",
    "canvas_w",
    "canvas_h",
    "trial_in_block",
    "global_trial_number",
    "goal_target_id",
    "goal_x",
    "goal_y",
    "prev_goal_x",
    "prev_goal_y",
    "A_px",
    "W_px",
    "ID_bits",
    "time_ms",
    "wrong_target_clicks",
    "miss_clicks",
    "total_errors",
    "path_length_px",
    "throughput_bps",
    "trial_start_timestamp_ms",
    "trial_end_timestamp_ms",
    "last_click_x",
    "last_click_y",
    "captured_target_id_correct_click",
  ].join("\t");

  var eventLogHeader = [
    "participant_id",
    "timestamp_ms",
    "event_type",
    "study_state",
    "condition_index",
    "block_number",
    "trial_in_block",
    "global_trial_number",
    "technique",
    "size_level",
    "spacing_level",
    "x",
    "y",
    "captured_target_id",
    "goal_target_id",
    "is_goal_selection",
    "wrong_target_clicks",
    "miss_clicks",
    "path_length_px",
  ].join("\t");

  function appendSanitizedRow(rows, values) {
    var row = [];
    for (var i = 0; i < values.length; i++) {
      row.push(sanitizeTsv(values[i]));
    }
    rows.push(row.join("\t"));
  }

  function downloadTextFile(content, filename) {
    var blob = new Blob([content], {
      type: "text/tab-separated-values;charset=utf-8;",
    });

    if (typeof saveAs === "function") {
      saveAs(blob, filename);
    } else {
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  function createLogger() {
    var trialRows = [trialLogHeader];
    var eventRows = [eventLogHeader];

    return {
      appendTrialRow: function (values) {
        appendSanitizedRow(trialRows, values);
      },
      appendEventRow: function (values) {
        appendSanitizedRow(eventRows, values);
      },
      exportFiles: function (participantSlug, sessionTag) {
        var trialFilename =
          "P" + participantSlug + "_trial_summary_" + sessionTag + ".tsv";
        var eventFilename =
          "P" + participantSlug + "_event_log_" + sessionTag + ".tsv";

        downloadTextFile(trialRows.join("\n") + "\n", trialFilename);
        downloadTextFile(eventRows.join("\n") + "\n", eventFilename);

        return {
          trialFilename: trialFilename,
          eventFilename: eventFilename,
          trialCount: trialRows.length - 1,
        };
      },
    };
  }

  global.A2Logger = {
    createLogger: createLogger,
  };
})(window);
