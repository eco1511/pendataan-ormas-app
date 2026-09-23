import type { Role } from './auth';
export const canEdit = (role: Role) => role === 'Administrator' || role === 'Operator';
export const canDelete = (role: Role) => role === 'Administrator';
export const canImport = (role: Role) => role === 'Administrator' || role === 'Operator';
export const canViewLogs = (role: Role) => role === 'Administrator';
