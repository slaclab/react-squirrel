/**
 * TypeScript type definitions for Squirrel data models
 * Based on the Python models in squirrel/model.py
 */

export enum Severity {
  NO_ALARM = 0,
  MINOR = 1,
  MAJOR = 2,
  INVALID = 3,
}

export enum Status {
  NO_ALARM = 0,
  READ = 1,
  WRITE = 2,
  HIHI = 3,
  HIGH = 4,
  LOLO = 5,
  LOW = 6,
  STATE = 7,
  COS = 8,
  COMM = 9,
  TIMEOUT = 10,
  HWLIMIT = 11,
  CALC = 12,
  SCAN = 13,
  LINK = 14,
  SOFT = 15,
  BAD_SUB = 16,
  UDF = 17,
  DISABLE = 18,
  SIMM = 19,
  READ_ACCESS = 20,
  WRITE_ACCESS = 21,
}

export type AnyEpicsType = string | number | boolean | Array<string | number>;

export interface EpicsData {
  data?: AnyEpicsType;
  status?: Status;
  severity?: Severity;
  timestamp?: Date;

  // Extra metadata
  units?: string;
  precision?: number;
  upper_ctrl_limit?: number;
  lower_ctrl_limit?: number;
  lower_alarm_limit?: number;  // LOLO
  upper_alarm_limit?: number;  // HIHI
  lower_warning_limit?: number; // LOW
  upper_warning_limit?: number; // HIGH
  enums?: string[];
}

export type TagSet = { [key: string]: any };

export interface PV {
  uuid: string;
  description: string;
  setpoint: string;
  readback: string;
  config: string;
  setpoint_data: EpicsData;
  readback_data: EpicsData;
  config_data: EpicsData;
  device: string;
  tags: TagSet;
  abs_tolerance?: number;
  rel_tolerance?: number;
  creation_time: Date;
}

export interface Snapshot {
  uuid: string;
  description: string;
  title: string;
  pvs: PV[];
  pvCount?: number;  // For list view without loading all PVs
  creation_time: Date;
}

export enum PVHeader {
  CHECKBOX = 0,
  SEVERITY = 1,
  DEVICE = 2,
  PV = 3,
  SETPOINT = 4,
  LIVE_SETPOINT = 5,
  READBACK = 6,
  LIVE_READBACK = 7,
  CONFIG = 8,
}

export const PV_HEADER_STRINGS: { [key in PVHeader]: string } = {
  [PVHeader.CHECKBOX]: "",
  [PVHeader.SEVERITY]: "",
  [PVHeader.DEVICE]: "Device",
  [PVHeader.PV]: "PV Name",
  [PVHeader.SETPOINT]: "Saved Value",
  [PVHeader.LIVE_SETPOINT]: "Live Value",
  [PVHeader.READBACK]: "Saved Readback",
  [PVHeader.LIVE_READBACK]: "Live Readback",
  [PVHeader.CONFIG]: "CON",
};
