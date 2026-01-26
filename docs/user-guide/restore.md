# Restore

The restore feature allows you to apply saved setpoint values from a snapshot back to the control system.

## When to Use Restore

Common use cases:

- **Recovery** - Return to a known good state after an issue
- **Maintenance** - Restore settings after maintenance work
- **Testing** - Reset to baseline between tests
- **Rollback** - Undo recent changes

## Starting a Restore

1. Open a snapshot's details page
2. Select the PVs you want to restore using checkboxes
3. Click the **Restore** button

<!-- TODO: Add screenshot: images/restore-button.png -->

## Preview Dialog

Before applying values, a preview dialog shows exactly what will be restored.

<!-- TODO: Add screenshot: images/restore-dialog.png -->

The preview shows:

| Column             | Description                            |
| ------------------ | -------------------------------------- |
| **PV Name**        | The process variable to be restored    |
| **Saved Setpoint** | The value that will be applied         |
| **Current Value**  | The current live value (for reference) |

!!! warning "Review Carefully"
Always review the preview before confirming. Restored values are applied immediately to the control system.

## Confirming the Restore

1. Review the PVs and values in the preview
2. Click **Restore** to apply the values
3. Wait for confirmation

The restore operation sends the saved setpoint values to the control system.

## Selecting PVs for Restore

### Select All

Use the checkbox in the header row to select all PVs.

### Select Individual PVs

Click the checkbox next to each PV you want to include.

### Filter Then Select

1. Use search or tag filters to narrow down the list
2. Select the PVs you need
3. Proceed with restore

!!! tip "Partial Restore"
You don't have to restore all PVs. Select only the ones you need to change.

## Safety Considerations

!!! danger "Production Systems"
Restoring values affects the live control system. Ensure you have appropriate authorization before performing restores on production systems.

### Best Practices

1. **Verify the snapshot** - Make sure you're restoring from the correct snapshot
2. **Review the preview** - Check that the values look correct
3. **Start small** - When uncertain, restore a few PVs first to verify behavior
4. **Communicate** - Inform relevant operators before restoring values
5. **Document** - Note why the restore was performed

## Troubleshooting

### Restore Failed

If a restore fails:

- Check network connectivity to the control system
- Verify the PVs are accessible
- Check for write permission issues
- Contact your system administrator

### Partial Success

Some PVs may fail while others succeed. The system will report which PVs could not be restored.
