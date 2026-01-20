import React, { useState } from 'react';
import {
  Box,
  Drawer,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Button,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, FilterList as FilterListIcon } from '@mui/icons-material';

const FILTER_SIDEBAR_WIDTH = 280;

export interface PVFilters {
  devices: string[];
  tags: string[];
  status: string[];
  searchTerm: string;
}

interface PVFilterSidebarProps {
  availableDevices?: string[];
  availableTags?: string[];
  filters: PVFilters;
  onFiltersChange: (filters: PVFilters) => void;
}

export const PVFilterSidebar: React.FC<PVFilterSidebarProps> = ({
  availableDevices = [],
  availableTags = [],
  filters,
  onFiltersChange,
}) => {
  const [localFilters, setLocalFilters] = useState<PVFilters>(filters);

  const handleDeviceToggle = (device: string) => {
    const newDevices = localFilters.devices.includes(device)
      ? localFilters.devices.filter((d) => d !== device)
      : [...localFilters.devices, device];

    const newFilters = { ...localFilters, devices: newDevices };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleTagToggle = (tag: string) => {
    const newTags = localFilters.tags.includes(tag)
      ? localFilters.tags.filter((t) => t !== tag)
      : [...localFilters.tags, tag];

    const newFilters = { ...localFilters, tags: newTags };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleStatusToggle = (status: string) => {
    const newStatus = localFilters.status.includes(status)
      ? localFilters.status.filter((s) => s !== status)
      : [...localFilters.status, status];

    const newFilters = { ...localFilters, status: newStatus };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: PVFilters = {
      devices: [],
      tags: [],
      status: [],
      searchTerm: '',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const statusOptions = ['NO_ALARM', 'MINOR', 'MAJOR', 'INVALID'];

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: FILTER_SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: FILTER_SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          position: 'relative',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          backgroundColor: 'white',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', height: '100%' }}>
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Filters
          </Typography>
        </Box>

        <Divider />

        {/* Clear Filters Button */}
        <Box sx={{ p: 2 }}>
          <Button
            variant="outlined"
            size="small"
            fullWidth
            onClick={handleClearFilters}
          >
            Clear All Filters
          </Button>
        </Box>

        <Divider />

        {/* Device Filter */}
        <Accordion defaultExpanded disableGutters elevation={0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2" fontWeight="bold">
              Device ({localFilters.devices.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {availableDevices.length > 0 ? (
                availableDevices.map((device) => (
                  <FormControlLabel
                    key={device}
                    control={
                      <Checkbox
                        size="small"
                        checked={localFilters.devices.includes(device)}
                        onChange={() => handleDeviceToggle(device)}
                      />
                    }
                    label={<Typography variant="body2">{device}</Typography>}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No devices available
                </Typography>
              )}
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        <Divider />

        {/* Tags Filter */}
        <Accordion defaultExpanded disableGutters elevation={0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2" fontWeight="bold">
              Tags ({localFilters.tags.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {availableTags.length > 0 ? (
                availableTags.map((tag) => (
                  <FormControlLabel
                    key={tag}
                    control={
                      <Checkbox
                        size="small"
                        checked={localFilters.tags.includes(tag)}
                        onChange={() => handleTagToggle(tag)}
                      />
                    }
                    label={<Typography variant="body2">{tag}</Typography>}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No tags available
                </Typography>
              )}
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        <Divider />

        {/* Status Filter */}
        <Accordion defaultExpanded disableGutters elevation={0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2" fontWeight="bold">
              Status ({localFilters.status.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {statusOptions.map((status) => (
                <FormControlLabel
                  key={status}
                  control={
                    <Checkbox
                      size="small"
                      checked={localFilters.status.includes(status)}
                      onChange={() => handleStatusToggle(status)}
                    />
                  }
                  label={<Typography variant="body2">{status}</Typography>}
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Drawer>
  );
};
