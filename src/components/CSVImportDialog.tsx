import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';
import { Upload } from '@mui/icons-material';
import { parseCSVToPVs, createTagMapping, createValidationSummary, ParsedCSVRow } from '../utils/csvParser';

interface CSVImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (data: ParsedCSVRow[]) => Promise<void>;
  availableTagGroups: Array<{ id: string; name: string; tags: Array<{ id: string; name: string }> }>;
}

export const CSVImportDialog: React.FC<CSVImportDialogProps> = ({
  open,
  onClose,
  onImport,
  availableTagGroups,
}) => {
  const [csvData, setCSVData] = useState<ParsedCSVRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [validationSummary, setValidationSummary] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [fileSelected, setFileSelected] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const result = parseCSVToPVs(content);

      if (result.errors.length > 0) {
        setParseErrors(result.errors);
        setCSVData([]);
        setValidationSummary('');
        setFileSelected(false);
        return;
      }

      setCSVData(result.data);
      setParseErrors([]);
      setFileSelected(true);

      // Validate tags
      if (result.data.length > 0) {
        // Collect all rejected groups and values across all rows
        const allRejectedGroups = new Set<string>();
        const allRejectedValues: Record<string, Set<string>> = {};

        result.data.forEach(row => {
          const mapping = createTagMapping(row.groups, availableTagGroups);

          mapping.rejectedGroups.forEach(group => allRejectedGroups.add(group));

          Object.entries(mapping.rejectedValues).forEach(([group, values]) => {
            if (!allRejectedValues[group]) {
              allRejectedValues[group] = new Set();
            }
            values.forEach(value => allRejectedValues[group].add(value));
          });
        });

        // Convert sets to arrays
        const rejectedGroups = Array.from(allRejectedGroups);
        const rejectedValues: Record<string, string[]> = {};
        Object.entries(allRejectedValues).forEach(([group, valueSet]) => {
          rejectedValues[group] = Array.from(valueSet);
        });

        const summary = createValidationSummary(rejectedGroups, rejectedValues);
        setValidationSummary(summary);
      }
    } catch (error) {
      setParseErrors([`Failed to read CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      setCSVData([]);
      setValidationSummary('');
      setFileSelected(false);
    }

    // Reset file input
    event.target.value = '';
  };

  const handleImport = async () => {
    if (csvData.length === 0) return;

    setImporting(true);
    try {
      await onImport(csvData);
      handleClose();
    } catch (error) {
      console.error('Import failed:', error);
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setCSVData([]);
    setParseErrors([]);
    setValidationSummary('');
    setFileSelected(false);
    setImporting(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>Import PVs from CSV</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* File Upload Section */}
          <Box>
            <input
              accept=".csv"
              style={{ display: 'none' }}
              id="csv-file-input"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="csv-file-input">
              <Button
                variant="contained"
                component="span"
                startIcon={<Upload />}
                disabled={importing}
              >
                Select CSV File
              </Button>
            </label>
          </Box>

          {/* CSV Format Instructions */}
          <Alert severity="info">
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>CSV Format Requirements:</strong>
            </Typography>
            <Typography variant="body2" component="div">
              • Required: At least one column named "Setpoint" or "Readback"
              <br />
              • Optional: "Device", "Description" columns
              <br />
              • Tag Groups: Any additional columns will be treated as tag groups
              <br />
              • Tag values can be comma-separated (e.g., "tag1, tag2")
            </Typography>
          </Alert>

          {/* Parse Errors */}
          {parseErrors.length > 0 && (
            <Alert severity="error">
              {parseErrors.map((error, index) => (
                <Typography key={index} variant="body2">
                  {error}
                </Typography>
              ))}
            </Alert>
          )}

          {/* Validation Summary */}
          {fileSelected && validationSummary && (
            <Alert severity={validationSummary.includes('Rejected') ? 'warning' : 'success'}>
              <Typography variant="body2">{validationSummary}</Typography>
              {validationSummary.includes('Rejected') && (
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  Note: Rejected groups/values will be ignored during import.
                </Typography>
              )}
            </Alert>
          )}

          {/* Preview Table */}
          {csvData.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Preview ({csvData.length} row{csvData.length !== 1 ? 's' : ''})
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Setpoint</TableCell>
                      <TableCell>Readback</TableCell>
                      <TableCell>Device</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Tags</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {csvData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{row.Setpoint}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{row.Readback}</TableCell>
                        <TableCell>{row.Device}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {row.Description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {Object.entries(row.groups).map(([groupName, values]) =>
                              values.map((value, vIdx) => (
                                <Chip
                                  key={`${groupName}-${vIdx}`}
                                  label={`${groupName}: ${value}`}
                                  size="small"
                                  variant="outlined"
                                />
                              ))
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={importing}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={csvData.length === 0 || importing}
          startIcon={importing ? <CircularProgress size={16} /> : undefined}
        >
          {importing ? 'Importing...' : `Import ${csvData.length} PV${csvData.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
