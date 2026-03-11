"""
This script processes the raw trial summary CSV files into a format suitable for JASP analysis.
"""
import pandas as pd

files = [
    "P1_trial_summary_20260306_154216.csv",
    "P2_trial_summary_20260307_130411.csv",
    "P3_trial_summary_20260307_215832.csv",
]

# Load all trial summaries
df = pd.concat([pd.read_csv(f) for f in files], ignore_index=True)

# DVs you may want to analyze
dvs = [
    "time_ms",
    "total_errors",
    "path_length_px",
    "throughput_bps",
    "wrong_target_clicks",
    "miss_clicks",
]

# Average across repeated trials/blocks for each participant and condition
group_cols = ["participant_id", "technique", "size_level", "spacing_level"]
mean_df = df.groupby(group_cols, as_index=False)[dvs].mean()

# Build stable condition labels
mean_df["cond"] = (
    mean_df["technique"]
    + "_"
    + mean_df["size_level"]
    + "_"
    + mean_df["spacing_level"]
)

# Choose a fixed column order for JASP
tech_order = ["POINT", "AREA", "BUBBLE"]
size_order = ["S", "M", "L"]
spacing_order = ["TIGHT", "MED", "LOOSE"]
desired_cols = [
    f"{t}_{s}_{sp}"
    for t in tech_order
    for s in size_order
    for sp in spacing_order
]

# Save long-format condition means
mean_df.to_csv("condition_means_long.csv", index=False)

# Save one wide CSV per DV
for dv in dvs:
    wide = mean_df.pivot(index="participant_id", columns="cond", values=dv)
    wide = wide.reindex(columns=desired_cols)
    wide.reset_index(inplace=True)
    wide.to_csv(f"{dv}_wide.csv", index=False)