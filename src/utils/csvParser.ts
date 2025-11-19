/**
 * CSV Parser Utility for PV Import
 * Converts CSV file data into format suitable for bulk PV import
 *
 * Matches the Python implementation in squirrel/utils.py
 */

export interface ParsedCSVRow {
  Setpoint: string;
  Readback: string;
  Device: string;
  Description: string;
  groups: Record<string, string[]>; // Tag group name -> tag values
}

export interface ParsedCSVResult {
  data: ParsedCSVRow[];
  groupColumns: string[]; // List of tag group column names found in CSV
  errors: string[];
}

/**
 * Parse CSV file content into PV data structure
 *
 * CSV Format (matches Python parse_csv_to_dict):
 * - Required columns: "Setpoint" or "Readback" (at least one)
 * - Optional columns: "Device", "Description"
 * - Any additional columns are treated as tag groups
 * - Tag values can be comma-separated (e.g., "tag1, tag2")
 * - Filters out 'nan' and 'none' values
 *
 * @param csvContent - Raw CSV file content as string
 * @returns Parsed PV data with tag groups and any errors
 */
export function parseCSVToPVs(csvContent: string): ParsedCSVResult {
  const errors: string[] = [];
  const data: ParsedCSVRow[] = [];

  // Split into lines and filter empty lines
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim());

  if (lines.length === 0) {
    errors.push('CSV file is empty');
    return { data, groupColumns: [], errors };
  }

  // Parse header row
  const rawHeaders = parseCSVLine(lines[0]);
  const cleanedHeaders = rawHeaders.map(h => h.trim()).filter(h => h);

  if (cleanedHeaders.length === 0) {
    errors.push('CSV header row is empty');
    return { data, groupColumns: [], errors };
  }

  // Validate required columns
  if (!cleanedHeaders.includes('Setpoint') && !cleanedHeaders.includes('Readback')) {
    errors.push('Header missing required columns "Setpoint" or "Readback"');
    return { data, groupColumns: [], errors };
  }

  // Identify tag group columns (any column that's not a standard field)
  const standardColumns = ['Setpoint', 'Readback', 'Device', 'Description'];
  const groupColumns = cleanedHeaders.filter(col => !standardColumns.includes(col));

  // Parse data rows (starting from row 2 in 1-indexed terms, row 1 in 0-indexed)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);

    // Create a row dictionary
    const rowDict: Record<string, string> = {};
    cleanedHeaders.forEach((header, index) => {
      rowDict[header] = index < values.length ? values[index].trim() : '';
    });

    const setpoint = rowDict['Setpoint'] || '';
    const readback = rowDict['Readback'] || '';

    // Skip row if both setpoint and readback are empty
    if (!setpoint && !readback) {
      continue;
    }

    const device = rowDict['Device'] || '';
    const description = rowDict['Description'] || '';

    // Parse tag groups
    const groups: Record<string, string[]> = {};

    groupColumns.forEach(groupName => {
      const cellValue = rowDict[groupName] || '';
      const trimmedValue = cellValue.trim();

      if (trimmedValue && trimmedValue.toLowerCase() !== 'nan' && trimmedValue.toLowerCase() !== 'none') {
        // Split comma-separated values and filter
        const values = trimmedValue
          .split(',')
          .map(val => val.trim())
          .filter(val => val);
        groups[groupName] = values;
      } else {
        groups[groupName] = [];
      }
    });

    data.push({
      Setpoint: setpoint,
      Readback: readback,
      Device: device,
      Description: description,
      groups,
    });
  }

  return {
    data,
    groupColumns,
    errors,
  };
}

/**
 * Parse a single CSV line, handling quoted fields
 * Simple CSV parser that handles basic quoting
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = i + 1 < line.length ? line[i + 1] : '';

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

/**
 * Create tag mapping from CSV groups to backend tag IDs
 * Matches Python _create_tag_mapping_from_csv
 *
 * @param csvGroups - Tag groups from CSV (group name -> tag values)
 * @param tagDef - Backend tag definition (group name -> tags with IDs)
 * @returns Validation results with accepted tag IDs and rejected values
 */
export interface TagMappingResult {
  tagIds: string[]; // Flat list of accepted tag IDs
  validGroups: Record<string, string[]>; // Group name -> valid tag IDs for that group
  rejectedGroups: string[]; // Group names that don't exist in backend
  rejectedValues: Record<string, string[]>; // Group name -> rejected tag values
}

export function createTagMapping(
  csvGroups: Record<string, string[]>,
  availableTagGroups: Array<{ id: string; name: string; tags: Array<{ id: string; name: string }> }>
): TagMappingResult {
  const tagIds: string[] = [];
  const validGroups: Record<string, string[]> = {};
  const rejectedGroups: string[] = [];
  const rejectedValues: Record<string, string[]> = {};

  // Process each CSV group
  Object.entries(csvGroups).forEach(([groupName, csvValues]) => {
    // Find matching tag group in backend
    const matchingGroup = availableTagGroups.find(g => g.name === groupName);

    if (!matchingGroup) {
      // Group doesn't exist in backend
      rejectedGroups.push(groupName);
      return;
    }

    const groupTagIds: string[] = [];
    const rejectedValuesForGroup: string[] = [];

    // For each CSV value, try to find matching tag in backend
    csvValues.forEach(csvValue => {
      const matchingTag = matchingGroup.tags.find(t => t.name === csvValue);

      if (matchingTag) {
        groupTagIds.push(matchingTag.id);
        tagIds.push(matchingTag.id);
      } else {
        rejectedValuesForGroup.push(csvValue);
      }
    });

    if (groupTagIds.length > 0) {
      validGroups[matchingGroup.name] = groupTagIds;
    }

    if (rejectedValuesForGroup.length > 0) {
      rejectedValues[matchingGroup.name] = rejectedValuesForGroup;
    }
  });

  return {
    tagIds,
    validGroups,
    rejectedGroups,
    rejectedValues,
  };
}

/**
 * Create validation summary message
 * Matches Python _create_validation_summary
 */
export function createValidationSummary(
  rejectedGroups: string[],
  rejectedValues: Record<string, string[]>
): string {
  const summaryParts: string[] = [];

  if (rejectedGroups.length > 0) {
    summaryParts.push(`Rejected groups: ${rejectedGroups.join(', ')}`);
  }

  if (Object.keys(rejectedValues).length > 0) {
    const valueParts: string[] = [];
    Object.entries(rejectedValues).forEach(([groupName, values]) => {
      valueParts.push(`${groupName}: ${values.sort().join(', ')}`);
    });
    summaryParts.push(`Rejected values: ${valueParts.join(' | ')}`);
  }

  return summaryParts.length > 0
    ? summaryParts.join(' • ')
    : 'All groups and values are valid';
}
