// =============================================================================
// PROJECT JULIE — AUTHORITATIVE UU-ERP SERVER SIMULATOR & CLIENT ENGINE
// Implements real & simulated REST APIs, OpenAPI schema discovery,
// Webhook event dispatch, rate-limiting, and incremental query endpoints.
// =============================================================================

import type { ERPEntityMapping, ERPEvent, ERPSchemaMetadata } from './types';

export class UUERPServerClient {
  private static instance: UUERPServerClient | null = null;
  private isConnected: boolean = true;
  private failureMode: string | null = null; // 'timeout' | '500' | '429' | '401' | null
  private rateLimitMaxRPM: number = 120;
  private requestCountCurrentMinute: number = 0;
  private minuteResetTimestamp: number = Date.now() + 60000;

  // Authoritative ERP in-memory datasets
  private authoritativeData: Record<string, any[]> = {
    students: [
      {
        id: 'std-1001',
        roll_no: 'UU21BBA1042',
        name: 'Vivek Rautela',
        program: 'Bachelor of Business Administration (BBA)',
        semester: 4,
        section: 'BBA-A',
        department_id: 'dept-mgmt-01',
        email: 'vivek.rautela@uudoon.in',
        phone: '+91-9876543210',
        admission_year: 2024,
        status: 'active',
        version: 3,
        updated_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'std-1002',
        roll_no: 'UU21BBA1043',
        name: 'Rahul Sharma',
        program: 'Bachelor of Business Administration (BBA)',
        semester: 4,
        section: 'BBA-A',
        department_id: 'dept-mgmt-01',
        email: 'rahul.sharma@uudoon.in',
        phone: '+91-9876543211',
        admission_year: 2024,
        status: 'active',
        version: 1,
        updated_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'std-1003',
        roll_no: 'UU22CSE2011',
        name: 'Priya Verma',
        program: 'B.Tech Computer Science & Engineering',
        semester: 6,
        section: 'CSE-1',
        department_id: 'dept-cs-01',
        email: 'priya.verma@uudoon.in',
        phone: '+91-9876543212',
        admission_year: 2023,
        status: 'active',
        version: 2,
        updated_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    attendance: [
      {
        id: 'att-bba-201-1001',
        student_id: 'std-1001',
        student_roll: 'UU21BBA1042',
        subject_code: 'BBA-201',
        subject_name: 'Corporate and Business Law',
        faculty_name: 'Dr. Namita',
        total_conducted: 24,
        total_present: 20,
        percentage: 83.33,
        semester: 4,
        academic_year: '2025-2026',
        version: 4,
        updated_at: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'att-bba-202-1001',
        student_id: 'std-1001',
        student_roll: 'UU21BBA1042',
        subject_code: 'BBA-202',
        subject_name: 'Management Accounting',
        faculty_name: 'Prof. Anupam Gupta',
        total_conducted: 18,
        total_present: 12,
        percentage: 66.67,
        semester: 4,
        academic_year: '2025-2026',
        version: 2,
        updated_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'att-bba-203-1001',
        student_id: 'std-1001',
        student_roll: 'UU21BBA1042',
        subject_code: 'BBA-203-DM1',
        subject_name: 'Fundamentals of Digital Marketing',
        faculty_name: 'Dr. Mohd Amir',
        total_conducted: 22,
        total_present: 18,
        percentage: 81.82,
        semester: 4,
        academic_year: '2025-2026',
        version: 3,
        updated_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'att-bba-201-1002',
        student_id: 'std-1002',
        student_roll: 'UU21BBA1043',
        subject_code: 'BBA-201',
        subject_name: 'Corporate and Business Law',
        faculty_name: 'Dr. Namita',
        total_conducted: 24,
        total_present: 15,
        percentage: 62.5,
        semester: 4,
        academic_year: '2025-2026',
        version: 1,
        updated_at: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
    fees: [
      {
        id: 'fee-1001-sem4',
        student_id: 'std-1001',
        student_roll: 'UU21BBA1042',
        semester: 4,
        total_amount: 65000,
        paid_amount: 65000,
        due_amount: 0,
        due_date: '2026-03-31',
        status: 'PAID',
        receipt_number: 'UU-REC-2026-9042',
        version: 2,
        updated_at: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: 'fee-1002-sem4',
        student_id: 'std-1002',
        student_roll: 'UU21BBA1043',
        semester: 4,
        total_amount: 65000,
        paid_amount: 30000,
        due_amount: 35000,
        due_date: '2026-03-31',
        status: 'PARTIALLY_PAID',
        receipt_number: 'UU-REC-2026-9043',
        version: 1,
        updated_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    employees: [
      {
        id: 'emp-201',
        employee_code: 'UU-FAC-102',
        name: 'Dr. Namita',
        designation: 'Associate Professor',
        department_id: 'dept-mgmt-01',
        email: 'namita@uudoon.in',
        phone: '+91-9811223344',
        status: 'active',
        version: 1,
        updated_at: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        id: 'emp-202',
        employee_code: 'UU-FAC-105',
        name: 'Prof. Anupam Gupta',
        designation: 'Professor & Head',
        department_id: 'dept-mgmt-01',
        email: 'anupam.gupta@uudoon.in',
        phone: '+91-9811223345',
        status: 'active',
        version: 1,
        updated_at: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        id: 'emp-203',
        employee_code: 'UU-FAC-110',
        name: 'Dr. Mohd Amir',
        designation: 'Assistant Professor',
        department_id: 'dept-mgmt-01',
        email: 'mohd.amir@uudoon.in',
        phone: '+91-9811223346',
        status: 'active',
        version: 1,
        updated_at: new Date(Date.now() - 259200000).toISOString(),
      },
    ],
    departments: [
      {
        id: 'dept-mgmt-01',
        code: 'UU-MGMT',
        name: 'Uttaranchal Institute of Management (UIM)',
        head_employee_id: 'emp-202',
        block_location: 'Management & Law Block',
        status: 'active',
        version: 1,
        updated_at: new Date(Date.now() - 604800000).toISOString(),
      },
      {
        id: 'dept-cs-01',
        code: 'UU-UIT-CSE',
        name: 'Uttaranchal Institute of Technology (Computer Science)',
        head_employee_id: 'emp-301',
        block_location: 'Engineering Block A',
        status: 'active',
        version: 1,
        updated_at: new Date(Date.now() - 604800000).toISOString(),
      },
    ],
    timetable: [
      {
        id: 'tt-bba-mon-1',
        program: 'BBA',
        semester: 4,
        section: 'BBA-A',
        day_of_week: 1, // Monday
        start_time: '09:30:00',
        end_time: '10:30:00',
        subject_code: 'BBA-201',
        subject_name: 'Corporate and Business Law',
        faculty_name: 'Dr. Namita',
        room_number: 'Room 304',
        class_type: 'Lecture',
        version: 1,
        updated_at: new Date(Date.now() - 604800000).toISOString(),
      },
      {
        id: 'tt-bba-mon-2',
        program: 'BBA',
        semester: 4,
        section: 'BBA-A',
        day_of_week: 1, // Monday
        start_time: '10:30:00',
        end_time: '11:30:00',
        subject_code: 'BBA-202',
        subject_name: 'Management Accounting',
        faculty_name: 'Prof. Anupam Gupta',
        room_number: 'Room 304',
        class_type: 'Lecture',
        version: 1,
        updated_at: new Date(Date.now() - 604800000).toISOString(),
      },
      {
        id: 'tt-bba-tue-1',
        program: 'BBA',
        semester: 4,
        section: 'BBA-A',
        day_of_week: 2, // Tuesday
        start_time: '11:30:00',
        end_time: '12:30:00',
        subject_code: 'BBA-203-DM1',
        subject_name: 'Fundamentals of Digital Marketing',
        faculty_name: 'Dr. Mohd Amir',
        room_number: 'Room 304',
        class_type: 'Lecture',
        version: 1,
        updated_at: new Date(Date.now() - 604800000).toISOString(),
      },
    ],
    notices: [
      {
        id: 'not-01',
        title: 'Mid-Term Examination Datesheet and Hall Ticket Release',
        category: 'Examination',
        date: '2026-08-28',
        content: 'All BBA and CSE students are hereby informed that Mid-Term Examinations will commence from September 10, 2026 in Examination Hall A. 75% minimum attendance is mandatory for hall ticket clearance.',
        issued_by: 'Office of the Controller of Examinations',
        version: 1,
        updated_at: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: 'not-02',
        title: 'Fee Payment Deadline for Academic Session 2026-27',
        category: 'Finance',
        date: '2026-08-20',
        content: 'Semester fee installments must be settled before March 31, 2026 via the Cyborg-ERP student portal to avoid late surcharge.',
        issued_by: 'Finance Department',
        version: 1,
        updated_at: new Date(Date.now() - 345600000).toISOString(),
      },
    ],
    results: [
      {
        id: 'res-1001-sem3',
        student_id: 'std-1001',
        student_roll: 'UU21BBA1042',
        semester: 3,
        sgpa: 8.45,
        cgpa: 8.20,
        result_status: 'PASSED',
        exam_session: 'Winter 2025',
        marks: [
          { subject_code: 'BBA-101', subject_name: 'Principles of Management', grade: 'A', credits: 4 },
          { subject_code: 'BBA-102', subject_name: 'Financial Accounting', grade: 'A+', credits: 4 },
          { subject_code: 'BBA-103', subject_name: 'Business Economics', grade: 'B+', credits: 4 },
        ],
        version: 1,
        updated_at: new Date(Date.now() - 2592000000).toISOString(),
      },
    ],
  };

  static getInstance(): UUERPServerClient {
    if (!this.instance) {
      this.instance = new UUERPServerClient();
    }
    return this.instance;
  }

  setFailureMode(mode: string | null) {
    this.failureMode = mode;
  }

  private enforceRateLimit(): void {
    const now = Date.now();
    if (now > this.minuteResetTimestamp) {
      this.requestCountCurrentMinute = 0;
      this.minuteResetTimestamp = now + 60000;
    }
    this.requestCountCurrentMinute++;
    if (this.requestCountCurrentMinute > this.rateLimitMaxRPM) {
      throw new Error('429 Too Many Requests: Rate limit exceeded on UU ERP server (Max 120 RPM).');
    }
  }

  private checkFailureInjection(): void {
    if (this.failureMode === 'timeout') {
      throw new Error('504 Gateway Timeout: UU ERP server did not respond in 10000ms.');
    }
    if (this.failureMode === '500') {
      throw new Error('500 Internal Server Error: UU ERP ASP.NET runtime error.');
    }
    if (this.failureMode === '401') {
      throw new Error('401 Unauthorized: Session token expired or invalid signature.');
    }
    if (this.failureMode === '429') {
      throw new Error('429 Rate Limit Exceeded.');
    }
  }

  /**
   * Discovers OpenAPI / Schema metadata from UU ERP
   */
  async discoverSchema(tenantId: string = 'default'): Promise<ERPSchemaMetadata> {
    this.enforceRateLimit();
    this.checkFailureInjection();

    const entities: Record<string, ERPEntityMapping> = {
      students: {
        entity: 'students',
        external_resource: '/api/v1/students',
        primary_key: 'id',
        updated_field: 'updated_at',
        delete_strategy: 'soft_delete',
        relationships: { department: 'department_id' },
        fields: [
          { name: 'id', type: 'string', required: true, isPrimaryKey: true },
          { name: 'roll_no', type: 'string', required: true },
          { name: 'name', type: 'string', required: true },
          { name: 'program', type: 'string', required: true },
          { name: 'semester', type: 'number', required: true },
          { name: 'section', type: 'string', required: false },
          { name: 'department_id', type: 'string', required: true },
          { name: 'email', type: 'string', required: true },
          { name: 'phone', type: 'string', required: false },
          { name: 'updated_at', type: 'date', required: true, isUpdatedAt: true },
        ],
        supported_operations: ['read', 'create', 'update', 'delete', 'bulk_update'],
        pagination_type: 'cursor',
        rate_limit_rpm: 120,
        has_webhook: true,
      },
      attendance: {
        entity: 'attendance',
        external_resource: '/api/v1/attendance',
        primary_key: 'id',
        updated_field: 'updated_at',
        delete_strategy: 'status_flag',
        relationships: { student: 'student_id' },
        fields: [
          { name: 'id', type: 'string', required: true, isPrimaryKey: true },
          { name: 'student_id', type: 'string', required: true },
          { name: 'student_roll', type: 'string', required: true },
          { name: 'subject_code', type: 'string', required: true },
          { name: 'subject_name', type: 'string', required: true },
          { name: 'faculty_name', type: 'string', required: false },
          { name: 'total_conducted', type: 'number', required: true },
          { name: 'total_present', type: 'number', required: true },
          { name: 'percentage', type: 'number', required: true },
          { name: 'semester', type: 'number', required: true },
          { name: 'updated_at', type: 'date', required: true, isUpdatedAt: true },
        ],
        supported_operations: ['read', 'create', 'update', 'bulk_update'],
        pagination_type: 'cursor',
        rate_limit_rpm: 120,
        has_webhook: true,
      },
      fees: {
        entity: 'fees',
        external_resource: '/api/v1/fees',
        primary_key: 'id',
        updated_field: 'updated_at',
        delete_strategy: 'status_flag',
        relationships: { student: 'student_id' },
        fields: [
          { name: 'id', type: 'string', required: true, isPrimaryKey: true },
          { name: 'student_id', type: 'string', required: true },
          { name: 'student_roll', type: 'string', required: true },
          { name: 'semester', type: 'number', required: true },
          { name: 'total_amount', type: 'number', required: true },
          { name: 'paid_amount', type: 'number', required: true },
          { name: 'due_amount', type: 'number', required: true },
          { name: 'status', type: 'string', required: true },
          { name: 'receipt_number', type: 'string', required: false },
          { name: 'updated_at', type: 'date', required: true, isUpdatedAt: true },
        ],
        supported_operations: ['read', 'update'],
        pagination_type: 'cursor',
        rate_limit_rpm: 120,
        has_webhook: true,
      },
      employees: {
        entity: 'employees',
        external_resource: '/api/v1/employees',
        primary_key: 'id',
        updated_field: 'updated_at',
        delete_strategy: 'soft_delete',
        relationships: { department: 'department_id' },
        fields: [
          { name: 'id', type: 'string', required: true, isPrimaryKey: true },
          { name: 'employee_code', type: 'string', required: true },
          { name: 'name', type: 'string', required: true },
          { name: 'designation', type: 'string', required: true },
          { name: 'department_id', type: 'string', required: true },
          { name: 'email', type: 'string', required: true },
          { name: 'updated_at', type: 'date', required: true, isUpdatedAt: true },
        ],
        supported_operations: ['read', 'create', 'update'],
        pagination_type: 'offset',
        rate_limit_rpm: 120,
        has_webhook: true,
      },
      departments: {
        entity: 'departments',
        external_resource: '/api/v1/departments',
        primary_key: 'id',
        updated_field: 'updated_at',
        delete_strategy: 'status_flag',
        relationships: { head_employee: 'head_employee_id' },
        fields: [
          { name: 'id', type: 'string', required: true, isPrimaryKey: true },
          { name: 'code', type: 'string', required: true },
          { name: 'name', type: 'string', required: true },
          { name: 'block_location', type: 'string', required: false },
          { name: 'updated_at', type: 'date', required: true, isUpdatedAt: true },
        ],
        supported_operations: ['read'],
        pagination_type: 'offset',
        rate_limit_rpm: 120,
        has_webhook: false,
      },
      timetable: {
        entity: 'timetable',
        external_resource: '/api/v1/timetable',
        primary_key: 'id',
        updated_field: 'updated_at',
        delete_strategy: 'status_flag',
        relationships: {},
        fields: [
          { name: 'id', type: 'string', required: true, isPrimaryKey: true },
          { name: 'program', type: 'string', required: true },
          { name: 'semester', type: 'number', required: true },
          { name: 'day_of_week', type: 'number', required: true },
          { name: 'start_time', type: 'string', required: true },
          { name: 'end_time', type: 'string', required: true },
          { name: 'subject_code', type: 'string', required: true },
          { name: 'subject_name', type: 'string', required: true },
          { name: 'faculty_name', type: 'string', required: true },
          { name: 'room_number', type: 'string', required: true },
          { name: 'updated_at', type: 'date', required: true, isUpdatedAt: true },
        ],
        supported_operations: ['read', 'update'],
        pagination_type: 'offset',
        rate_limit_rpm: 120,
        has_webhook: true,
      },
      notices: {
        entity: 'notices',
        external_resource: '/api/v1/notices',
        primary_key: 'id',
        updated_field: 'updated_at',
        delete_strategy: 'status_flag',
        relationships: {},
        fields: [
          { name: 'id', type: 'string', required: true, isPrimaryKey: true },
          { name: 'title', type: 'string', required: true },
          { name: 'category', type: 'string', required: true },
          { name: 'content', type: 'string', required: true },
          { name: 'date', type: 'string', required: true },
          { name: 'updated_at', type: 'date', required: true, isUpdatedAt: true },
        ],
        supported_operations: ['read'],
        pagination_type: 'cursor',
        rate_limit_rpm: 120,
        has_webhook: true,
      },
      results: {
        entity: 'results',
        external_resource: '/api/v1/results',
        primary_key: 'id',
        updated_field: 'updated_at',
        delete_strategy: 'status_flag',
        relationships: { student: 'student_id' },
        fields: [
          { name: 'id', type: 'string', required: true, isPrimaryKey: true },
          { name: 'student_id', type: 'string', required: true },
          { name: 'student_roll', type: 'string', required: true },
          { name: 'semester', type: 'number', required: true },
          { name: 'sgpa', type: 'number', required: true },
          { name: 'cgpa', type: 'number', required: true },
          { name: 'result_status', type: 'string', required: true },
          { name: 'updated_at', type: 'date', required: true, isUpdatedAt: true },
        ],
        supported_operations: ['read', 'update'],
        pagination_type: 'cursor',
        rate_limit_rpm: 120,
        has_webhook: true,
      },
    };

    return {
      tenantId,
      discoveredAt: new Date().toISOString(),
      apiVersion: 'v1.4-Cyborg',
      serverPlatform: 'Microsoft-IIS/10.0 + ASP.NET MVC 4.0 / PostgreSQL',
      entities,
      rateLimitRPM: this.rateLimitMaxRPM,
      webhookCapabilities: true,
      discoveredEndpointsCount: Object.keys(entities).length,
      readPermissionsOk: true,
      writePermissionsOk: true,
    };
  }

  /**
   * Queries authoritative records with incremental 'updated_after' filtering and pagination
   */
  async fetchEntityRecords(
    entity: string,
    params: {
      updatedAfter?: string;
      limit?: number;
      cursor?: string;
      page?: number;
    } = {}
  ): Promise<{
    data: any[];
    nextCursor?: string;
    hasMore: boolean;
    totalCount: number;
  }> {
    this.enforceRateLimit();
    this.checkFailureInjection();

    const allRecords = this.authoritativeData[entity] || [];
    let filtered = [...allRecords];

    if (params.updatedAfter) {
      const afterTime = new Date(params.updatedAfter).getTime();
      filtered = filtered.filter(
        (r) => new Date(r.updated_at).getTime() > afterTime
      );
    }

    const limit = params.limit || 50;
    const startIndex = params.cursor ? parseInt(params.cursor, 10) : (params.page ? (params.page - 1) * limit : 0);
    const endIndex = startIndex + limit;

    const pageSlice = filtered.slice(startIndex, endIndex);
    const hasMore = endIndex < filtered.length;
    const nextCursor = hasMore ? String(endIndex) : undefined;

    return {
      data: pageSlice,
      nextCursor,
      hasMore,
      totalCount: filtered.length,
    };
  }

  /**
   * Fetches an authoritative record by primary key
   */
  async fetchRecordById(entity: string, id: string): Promise<any | null> {
    this.enforceRateLimit();
    this.checkFailureInjection();

    const records = this.authoritativeData[entity] || [];
    const item = records.find((r) => r.id === id || r.student_id === id);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  /**
   * Executes a write mutation against the authoritative UU ERP API
   */
  async executeMutation(
    entity: string,
    action: 'create' | 'update' | 'delete',
    payload: Record<string, any>
  ): Promise<{ success: boolean; record: any; message: string }> {
    this.enforceRateLimit();
    this.checkFailureInjection();

    const records = this.authoritativeData[entity] || [];

    if (action === 'create') {
      const newId = payload.id || `${entity.slice(0, 3)}-${Date.now()}`;
      const newRecord = {
        ...payload,
        id: newId,
        version: 1,
        updated_at: new Date().toISOString(),
      };
      records.push(newRecord);
      this.authoritativeData[entity] = records;
      return { success: true, record: newRecord, message: `Created record in ${entity}` };
    }

    if (action === 'update') {
      const id = payload.id || payload.student_id;
      const idx = records.findIndex((r) => r.id === id);
      if (idx === -1) {
        throw new Error(`Record with id ${id} not found in ${entity}`);
      }
      const existing = records[idx];
      const updatedRecord = {
        ...existing,
        ...payload,
        version: (existing.version || 1) + 1,
        updated_at: new Date().toISOString(),
      };
      records[idx] = updatedRecord;
      this.authoritativeData[entity] = records;
      return { success: true, record: updatedRecord, message: `Updated record ${id} in ${entity}` };
    }

    if (action === 'delete') {
      const id = payload.id;
      const idx = records.findIndex((r) => r.id === id);
      if (idx !== -1) {
        const deleted = records.splice(idx, 1)[0];
        return { success: true, record: deleted, message: `Deleted record ${id} from ${entity}` };
      }
      throw new Error(`Record ${id} not found in ${entity}`);
    }

    throw new Error(`Unsupported operation ${action}`);
  }
}

export const uuerpClient = UUERPServerClient.getInstance();
