# PV Browser

The PV Browser lets you explore, search, and manage the Process Variables (PVs) in your system.

## Accessing the PV Browser

Click **PV Browser** in the sidebar to open the browser view.

<!-- TODO: Add screenshot: images/pv-browser.png -->

## Browsing PVs

The PV Browser displays all configured PVs in a table:

| Column          | Description                    |
| --------------- | ------------------------------ |
| **PV Name**     | The full process variable name |
| **Device**      | The device this PV belongs to  |
| **Description** | A human-readable description   |
| **Live Value**  | Current real-time value        |
| **Tags**        | Assigned tag groups            |

## Searching for PVs

Use the **search bar** to find specific PVs.

### Wildcard Search

You can use wildcards to search for patterns:

- `*` matches any characters
- `?` matches a single character

**Examples:**

| Search Pattern | Matches                       |
| -------------- | ----------------------------- |
| `QUAD:*`       | All PVs starting with "QUAD:" |
| `*:BDES`       | All PVs ending with ":BDES"   |
| `QUAD:*:BDES`  | BDES PVs for all QUADs        |

## Adding PVs

!!! warning "Admin Required"
Adding PVs requires admin privileges.

### Adding Individual PVs

1. Click the **Add PV** button
2. Enter the PV name
3. Fill in optional details (device, description)
4. Click **Add**

### Importing from CSV

For bulk additions, you can import PVs from a CSV file.

1. Click the **Import CSV** button
2. Select your CSV file
3. Review the import preview
4. Click **Import**

<!-- TODO: Add screenshot: images/csv-import-dialog.png -->

#### CSV Format

The CSV file should have the following columns:

```csv
pv_name,device,description
QUAD:001:BDES,QUAD:001,Quad 1 BDES setpoint
QUAD:001:BACT,QUAD:001,Quad 1 BACT readback
```

!!! tip "CSV Headers"
The first row should contain column headers. At minimum, `pv_name` is required.

## Viewing PV Details

Click on a PV name to open its [details page](pv-details.md).

## Managing PV Tags

You can assign tags to PVs to organize them into groups:

1. Select one or more PVs using checkboxes
2. Click the **Tags** button
3. Select the tags to assign
4. Click **Save**

See [Tags](tags.md) for more information on tag management.
