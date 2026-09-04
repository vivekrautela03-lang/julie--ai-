// =============================================================================
// PROJECT JULIE — AUTONOMOUS UU-ERP DATA PLATFORM CONTRACTS & SCHEMAS
// Official Portal: https://uuerp.uudoon.in | Event-Driven & Bidirectional Platform
// =============================================================================

export type ERPConnectionState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'SYNCING'
  | 'SESSION_EXPIRED'
  | 'SYNC_ERROR'
  | 'PAUSED';

export type RBACRole =
  | 'Administrator'
  | 'Teacher'
  | 'Finance'
  | 'DepartmentHead'
  | 'Student';

export interface UserContext {
  userId: string;
  role: RBACRole;
  tenantId: string;
  departmentId?: string;
  assignedClasses?: string[];
  permissions: string[];
}

export interface ERPFieldDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  required: boolean;
  isPrimaryKey?: boolean;
  isUpdatedAt?: boolean;
  isCreatedAt?: boolean;
  description?: string;
}

export interface ERPEntityMapping {
  entity: string; // e.g. 'students', 'attendance', 'fees', 'employees'
  external_resource: string; // e.g. '/api/v1/students'
  primary_key: string; // e.g. 'id' or 'student_id'
  updated_field: string; // e.g. 'updated_at' or 'last_modified'
  delete_strategy: 'soft_delete' | 'hard_delete' | 'status_flag';
  relationships: Record<string, string>; // e.g. { class: 'class_id', department: 'department_id' }
  fields: ERPFieldDefinition[];
  supported_operations: ('read' | 'create' | 'update' | 'delete' | 'bulk_update')[];
  pagination_type: 'cursor' | 'offset' | 'page';
  rate_limit_rpm?: number;
  has_webhook: boolean;
}

export interface ERPSchemaMetadata {
  tenantId: string;
  discoveredAt: string;
  apiVersion: string;
  serverPlatform: string;
  entities: Record<string, ERPEntityMapping>;
  rateLimitRPM: number;
  webhookCapabilities: boolean;
  discoveredEndpointsCount: number;
  readPermissionsOk: boolean;
  writePermissionsOk: boolean;
}

export interface ERPEntityRecord {
  id: string;
  tenant_id: string;
  entity_type: string;
  external_id: string;
  data: Record<string, any>;
  version: number;
  checksum: string;
  updated_at: string;
  last_synced_at: string;
  sync_status: 'synced' | 'pending' | 'conflict' | 'error';
}

export type ERPEventType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'bulk_updated'
  | 'sync_requested';

export interface ERPEvent {
  event_id: string;
  source: string; // e.g. 'uu_erp_webhook' | 'uu_erp_poll' | 'julie_action'
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  event_type: ERPEventType;
  timestamp: string;
  payload?: Record<string, any>;
  version?: number;
  signature?: string;
}

export interface ERPEventQueueItem {
  id: string;
  tenant_id: string;
  event_id: string;
  entity_type: string;
  entity_id: string;
  event_type: ERPEventType;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter';
  retry_count: number;
  max_retries: number;
  created_at: string;
  processed_at?: string;
  error_message?: string;
}

export interface ERPDeadLetterItem {
  id: string;
  tenant_id: string;
  event_id: string;
  entity_type: string;
  entity_id: string;
  error_message: string;
  payload: any;
  retry_count: number;
  failed_at: string;
  resolution_status: 'unresolved' | 'replayed' | 'resolved' | 'discarded';
  resolved_at?: string;
  resolved_by?: string;
}

export interface ERPSyncCheckpoint {
  id: string;
  tenant_id: string;
  entity_type: string;
  last_cursor?: string;
  last_synced_timestamp: string;
  sync_phase: 'initial_snapshot' | 'incremental' | 'complete' | 'error';
  status: 'active' | 'idle' | 'failed';
  records_processed: number;
}

export interface ERPConflictRecord {
  id: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  julie_version?: any;
  erp_version?: any;
  resolution_strategy: 'erp_authoritative_overwrite' | 'manual_review';
  resolved_at: string;
  details: string;
}

export interface ERPAuditLog {
  id: string;
  tenant_id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: any;
  new_value?: any;
  reason?: string;
  status: 'success' | 'denied' | 'failed';
  erp_response?: any;
  timestamp: string;
}

export interface ERPSyncTelemetry {
  tenantId: string;
  connectionStatus: ERPConnectionState;
  webhookStatus: 'ACTIVE' | 'INACTIVE' | 'FAILED';
  lastSuccessfulSyncTimestamp?: string;
  pendingEventsCount: number;
  processedEventsCount: number;
  failedEventsCount: number;
  deadLetterCount: number;
  recordsSyncedCount: number;
  avgSyncLatencyMs: number;
  apiHealth: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  lastHealthCheckTimestamp: string;
}

export interface ERPBidirectionalActionRequest {
  tenantId: string;
  actor: UserContext;
  action: 'create_record' | 'update_record' | 'delete_record' | 'approve_record' | 'bulk_update';
  entity_type: string;
  entity_id?: string;
  payload: Record<string, any>;
  reason: string;
  isConfirmed?: boolean;
}

export interface ERPBidirectionalActionPlan {
  planId: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  isHighRisk: boolean;
  affectedRecordCount: number;
  oldValuePreview?: any;
  proposedValuePreview: any;
  requiresConfirmation: boolean;
  permissionGranted: boolean;
  validationErrors?: string[];
  summary: string;
}

export interface ERPBidirectionalActionResult {
  success: boolean;
  planId: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  erpResponse?: any;
  auditLogId?: string;
  message: string;
  error?: string;
}

export interface SyncDiagnosticReport {
  timestamp: string;
  summary: string;
  telemetry: ERPSyncTelemetry;
  diagnostics: {
    isApiReachable: boolean;
    isWebhookActive: boolean;
    syncLagSeconds: number;
    pendingQueueDepth: number;
    recentErrors: string[];
    deadLetterCount: number;
  };
  recommendations: string[];
}

export interface UUERPSubjectAttendance {
  subjectId: string;
  code: string;
  name: string;
  faculty: string;
  totalConducted: number;
  totalPresent: number;
  percentage: number;
  safeMisses: number;
  recoveryNeeded: number;
}

export interface UERPOverallAttendance {
  totalLectures: number;
  totalPresent: number;
  percentage: number;
  fromDate?: string;
  toDate?: string;
}

export interface UUERPStudentProfile {
  studentId: string;
  studentName: string;
  program: string;
  semester: number;
  section?: string;
  rollNo?: string;
  university: string;
}

export interface UUERPSyncMetadata {
  lastSyncAt?: string;
  lastSuccessfulSyncAt?: string;
  syncStatus: ERPConnectionState;
  dataSource: 'uuerp.uudoon.in' | 'local_cache';
  errorMessage?: string;
}

export interface UUERPExtractedData {
  profile?: Partial<UUERPStudentProfile>;
  overall?: UERPOverallAttendance;
  subjects: UUERPSubjectAttendance[];
  rawHtmlLength: number;
  extractedAt: string;
}
