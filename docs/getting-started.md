# Getting Started

This guide will help you get up and running with Squirrel.

## Prerequisites

Before using Squirrel, ensure:

1. The **backend API** (squirrel backend) is running and accessible
2. You have a modern web browser (Chrome, Firefox, Edge, or Safari)
3. Network access to your EPICS control system (for live values)

## Accessing the Application

Open your web browser and navigate to the Squirrel URL provided by your administrator.

## User Interface Overview

Squirrel has a simple, consistent layout:

<!-- TODO: Add screenshot: images/main-interface.png -->

### Sidebar Navigation

The left sidebar provides access to all main features:

- **Snapshots** - View and manage saved snapshots
- **PV Browser** - Browse and search for PVs
- **Tags** - Manage tag groups for organizing PVs

### Main Content Area

The main area displays the content for the selected feature. Most views include:

- **Search bar** - Filter items by name or other criteria
- **Action buttons** - Create, delete, or perform operations
- **Data table** - View and interact with data

### Admin Mode

Some features require admin privileges. If you have admin access, you can toggle admin mode using the switch in the sidebar.

## Next Steps

- Learn about [Snapshots](user-guide/snapshots.md) - the core feature for saving PV states
- Explore the [PV Browser](user-guide/pv-browser.md) to find and manage PVs
- Set up [Tags](user-guide/tags.md) to organize your PVs
