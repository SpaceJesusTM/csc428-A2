# CSC428 Assignment 2 - Controlled Experiment

## Overview
This project runs a controlled target-acquisition experiment using a within-subject 3x3x3 full-factorial design:
- Technique: `POINT`, `AREA`, `BUBBLE`
- Target size: `S`, `M`, `L` (radius levels)
- Target spacing: `TIGHT`, `MED`, `LOOSE` (minimum separation levels)

Each participant completes all 27 condition-blocks.

## Requirements
- Desktop or laptop computer
- External mouse for input (recommended by assignment)
- Modern browser (Chrome or Firefox recommended)

## How To Run
1. Open a terminal in this folder.
2. Start a local server:
   `python3 -m http.server 8000`
3. Open:
   `http://localhost:8000/code5.html`

## Hosted Version (GitHub Pages)
You can run the experiment directly at:
`https://spacejesustm.github.io/csc428-A2/code5.html`

## No-Install Option (Non-Technical)
If you are running with participants who are not technical:
1. Send them the project as a `.zip`.
2. Ask them to unzip it.
3. Ask them to double-click `code5.html` (Chrome recommended).
4. If prompted, allow downloads.

In this mode, output files still download to the participant's normal browser download location (usually `Downloads`).

## Participant Setup
On load, the page prompts for a participant ID.
- Numeric IDs (`1`, `2`, `3`, etc.) are used to counterbalance technique order.
- If non-numeric text is entered, the program still runs, and defaults to group-1 technique ordering logic.

## Study Flow
- The study shows a transition/rest screen before each condition-block.
- Click once to start the next condition.
- Each condition has 10 trials.
- During a trial, click the highlighted (salmon) target as quickly and accurately as possible.
- Errors are correctable: trials end only on the first correct click.
- Rest breaks occur between condition-blocks.

## Counterbalancing And Ordering
Technique order is assigned by participant group:
- Group 1: `BUBBLE -> POINT -> AREA`
- Group 2: `POINT -> AREA -> BUBBLE`
- Group 3: `AREA -> BUBBLE -> POINT`

Within each technique, the 9 size x spacing combinations are randomized.

## Output Files
At study completion, two tab-separated files are downloaded:
- `P<participant>_trial_summary_<timestamp>.tsv`
- `P<participant>_event_log_<timestamp>.tsv`

The trial summary file is the main dataset for analysis.
Files are saved by the browser to its default download folder (usually `Downloads`), unless the browser is configured to ask for a save location.

## Logged Variables
Independent variables and condition metadata:
- `technique`, `size_level`, `radius_px`, `spacing_level`, `min_sep_px`
- `condition_index`, `block_number`, `technique_order_index`, `technique_block_condition_index`

Dependent variables (per trial):
- `time_ms`
- `wrong_target_clicks`
- `miss_clicks`
- `path_length_px`
- `throughput_bps`

Additional analysis/reproducibility fields include:
- `goal_target_id`, `goal_x`, `goal_y`
- `prev_goal_x`, `prev_goal_y`
- `A_px`, `W_px`, `ID_bits`
- trial timestamps and click metadata

## Troubleshooting
- If files do not download, allow downloads for the current site (`localhost` or GitHub Pages domain) and rerun.
- If the page is blank, confirm the local server is running and the URL is correct.
- If your browser blocks CDN scripts, switch browsers or check network restrictions.
