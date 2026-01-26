# Snapshot Comparison

The comparison view lets you see differences between two snapshots side by side, making it easy to identify what changed between configurations.

## Starting a Comparison

There are two ways to start a comparison:

### From Snapshot Details

1. Open a snapshot's details page
2. Click the **Compare** button
3. Select the second snapshot to compare against

### From the Snapshot List

1. Select two snapshots using the checkboxes
2. Click the **Compare** button

## Understanding the Comparison View

<!-- TODO: Add screenshot: images/snapshot-comparison.png -->

The comparison displays PVs in a table with columns from both snapshots:

| Column               | Description                                   |
| -------------------- | --------------------------------------------- |
| **PV Name**          | The process variable name                     |
| **Main Setpoint**    | Setpoint value from the first (main) snapshot |
| **Main Readback**    | Readback value from the first snapshot        |
| **Compare Setpoint** | Setpoint value from the second snapshot       |
| **Compare Readback** | Readback value from the second snapshot       |

## Color-Coded Differences

The comparison view highlights differences to make them easy to spot:

- **Highlighted rows** - PVs where values differ between snapshots
- **Normal rows** - PVs with identical values in both snapshots

!!! tip "Finding Changes Quickly"
Use the filter options to show only PVs with differences, hiding identical values.

## Filtering the Comparison

Use the controls at the top to focus on specific PVs:

- **Search** - Filter by PV name
- **Show differences only** - Hide PVs with identical values
- **Tag filter** - Show only PVs with specific tags

## Performance

The comparison view uses virtual scrolling to handle large numbers of PVs efficiently. Even with 10,000+ PVs, scrolling remains smooth.

## Use Cases

### Before/After Maintenance

Compare a "before maintenance" snapshot with an "after maintenance" snapshot to verify only intended changes were made.

### Configuration Drift Detection

Compare the current state against a baseline configuration to identify unexpected changes.

### Troubleshooting

Compare a "working" snapshot with the current state to identify what changed before a problem occurred.
