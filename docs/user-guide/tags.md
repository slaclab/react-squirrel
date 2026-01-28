# Tags

Tags help you organize PVs into logical groups for easier filtering and management.

## What are Tags?

Tags are labels you can assign to PVs. A PV can have multiple tags, and tags can be organized into **tag groups**.

**Examples of tag groups:**

- **System** - Magnets, RF, Vacuum, Diagnostics
- **Location** - Sector 1, Sector 2, Injector, Linac
- **Priority** - Critical, Standard, Optional

## Accessing Tag Management

Click **Tags** in the sidebar to manage tag groups.

<!-- TODO: Add screenshot: images/tags-page.png -->

## Filtering by Tags

Throughout Squirrel, you can filter PV tables by tags:

1. Look for the **tag filter** dropdown above the table
2. Select one or more tags
3. The table updates to show only matching PVs

This works in:

- Snapshot Details
- Snapshot Comparison
- PV Browser

## Managing Tag Groups

!!! warning "Admin Required"
Creating and modifying tag groups requires admin privileges.

### Creating a Tag Group

1. Click **Create Tag Group**
2. Enter a **name** for the group
3. Add **tags** within the group
4. Click **Save**

<!-- TODO: Add screenshot: images/create-tag-group.png -->

### Editing a Tag Group

1. Click on the tag group name
2. Modify the name or tags
3. Click **Save**

### Adding Tags to a Group

1. Open the tag group
2. Click **Add Tag**
3. Enter the tag name
4. Click **Add**

### Deleting Tags

1. Open the tag group
2. Click the delete icon next to the tag
3. Confirm the deletion

!!! warning "Impact of Deleting Tags"
Deleting a tag removes it from all PVs that have it assigned.

## Assigning Tags to PVs

You can assign tags to PVs from:

### PV Browser

1. Select PVs using checkboxes
2. Click **Tags**
3. Select tags to assign
4. Click **Save**

### PV Details

1. Open the PV details page
2. Click **Edit** (admin mode required)
3. Modify tag assignments
4. Click **Save**

## Best Practices

!!! tip "Tag Organization" - Use consistent naming conventions - Create tag groups that match your organizational structure - Avoid too many tags - keep it manageable - Use descriptive names that are clear to all users
