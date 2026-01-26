# Snapshots

Snapshots are the core feature of Squirrel. A snapshot captures the values of all configured PVs at a specific point in time, allowing you to save, compare, and restore control system states.

## What is a Snapshot?

A snapshot contains:

- **Timestamp** - When the snapshot was created
- **Comment** - A description of the snapshot purpose
- **PV Values** - The setpoint and readback values for each PV at capture time

## Viewing the Snapshot List

Navigate to **Snapshots** in the sidebar to see all saved snapshots.

<!-- TODO: Add screenshot: images/snapshot-list.png -->

The list shows:

- Snapshot name/comment
- Creation date and time
- Number of PVs captured

Use the **search bar** to filter snapshots by name.

## Creating a Snapshot

1. Click the **Create Snapshot** button
2. Enter a descriptive **comment** for the snapshot
3. Click **Create**

<!-- TODO: Add screenshot: images/create-snapshot-dialog.png -->

!!! tip "Naming Conventions"
Use descriptive comments that indicate the purpose or state, such as "Before maintenance" or "Baseline configuration 2024-01".

The snapshot will capture the current values of all configured PVs. A progress indicator shows the capture status.

## Viewing Snapshot Details

Click on a snapshot name to view its details.

<!-- TODO: Add screenshot: images/snapshot-details.png -->

The details page shows:

| Column             | Description                                         |
| ------------------ | --------------------------------------------------- |
| **PV Name**        | The process variable name                           |
| **Saved Setpoint** | The setpoint value when the snapshot was taken      |
| **Saved Readback** | The readback value when the snapshot was taken      |
| **Live Value**     | The current real-time value (updates automatically) |
| **Severity**       | Alarm severity indicator                            |

### Filtering PVs

Use the controls at the top to filter the PV list:

- **Search** - Filter by PV name or device
- **Tag filter** - Show only PVs with specific tags

### Selecting PVs

Click the checkbox next to PVs to select them for:

- **Restore** - Apply saved values back to the control system
- **Compare** - Include in snapshot comparison

## Deleting a Snapshot

!!! warning "Admin Required"
Deleting snapshots requires admin privileges.

1. Select the snapshot(s) to delete
2. Click the **Delete** button
3. Confirm the deletion

Deleted snapshots cannot be recovered.

## Next Steps

- [Compare two snapshots](snapshot-comparison.md) to see differences
- [Restore values](restore.md) from a snapshot to the control system
