import React from 'react';
import {
  FormControl,
  Select,
  Chip,
  MenuItem,
  Checkbox,
  ListItemText,
  SelectChangeEvent,
} from '@mui/material';

interface TagGroupSelectProps {
  groupId: string;
  groupName: string;
  tags: Array<{ id: string; name: string }>;
  selectedValues: string[];
  onChange: (groupName: string, selectedIds: string[]) => void;
  /** If true, uses tag IDs for selection. If false, uses tag names. Default: true */
  useIds?: boolean;
}

export const TagGroupSelect: React.FC<TagGroupSelectProps> = ({
  groupId,
  groupName,
  tags,
  selectedValues,
  onChange,
  useIds = true,
}) => {
  const selectedTagNames = useIds
    ? selectedValues
        .map((id) => tags.find((t) => t.id === id)?.name)
        .filter((name): name is string => !!name)
    : selectedValues;

  const sortedTags = [...tags].sort((a, b) => {
    const aValue = useIds ? a.id : a.name;
    const bValue = useIds ? b.id : b.name;
    const aSelected = selectedValues.includes(aValue);
    const bSelected = selectedValues.includes(bValue);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return 0;
  });

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    onChange(groupName, typeof value === 'string' ? value.split(',') : value);
  };

  return (
    <FormControl key={groupId} size="small">
      <Select
        multiple
        value={selectedValues}
        onChange={handleChange}
        displayEmpty
        renderValue={() => (
          <Chip
            label={
              selectedTagNames.length === 0 ? (
                groupName
              ) : (
                <span>
                  {groupName} |{' '}
                  <span style={{ color: '#1976d2' }}>{selectedTagNames.join(', ')}</span>
                </span>
              )
            }
            size="small"
            variant="outlined"
            sx={{
              borderRadius: '16px',
              height: 28,
              maxWidth: '100%',
              '& .MuiChip-label': {
                px: 1.5,
              },
            }}
          />
        )}
        sx={{
          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
          '& .MuiSelect-select': {
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          },
        }}
        MenuProps={{
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
          },
          disablePortal: false,
          PaperProps: {
            sx: {
              mt: 1,
              maxHeight: 200,
              width: 220,
              overflow: 'auto',
              borderRadius: 2,
            },
          },
        }}
      >
        {sortedTags.map((tag) => {
          const value = useIds ? tag.id : tag.name;
          const isChecked = selectedValues.includes(value);
          return (
            <MenuItem
              key={tag.id}
              value={value}
              sx={{
                minWidth: 'max-content',
                py: 0.25,
                px: 1,
                minHeight: 'unset',
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <Checkbox checked={isChecked} size="small" sx={{ p: 0.25 }} />
              <ListItemText
                primary={tag.name}
                sx={{ whiteSpace: 'nowrap', ml: 0.5 }}
                primaryTypographyProps={{ fontSize: '0.8rem' }}
              />
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};
