// =============================================================================
// PROJECT JULIE — REAL UU-ERP HTML/DATA PARSER
// Robust, DOM-aware extraction of student profile & attendance records
// from Uttaranchal University Cyborg-ERP server-rendered responses.
// =============================================================================

import type {
  UUERPExtractedData,
  UUERPSubjectAttendance,
  UERPOverallAttendance,
  UUERPStudentProfile,
} from './types';

export class UUERPParser {
  /**
   * Parses the HTML string of /Web_StudentAcademic/Cyborg_StudentAttendanceAcademic
   */
  static parseAttendancePage(html: string): UUERPExtractedData {
    if (!html || typeof html !== 'string') {
      return {
        subjects: [],
        rawHtmlLength: 0,
        extractedAt: new Date().toISOString(),
      };
    }

    // In browser or Electron renderer, DOMParser is available
    if (typeof DOMParser !== 'undefined') {
      return this.parseWithDOM(html);
    } else {
      return this.parseWithRegex(html);
    }
  }

  /**
   * Primary parser using standard DOMParser
   */
  private static parseWithDOM(html: string): UUERPExtractedData {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const profile = this.extractProfile(doc);
    const { subjects, overall } = this.extractAttendanceTables(doc);

    return {
      profile,
      overall,
      subjects,
      rawHtmlLength: html.length,
      extractedAt: new Date().toISOString(),
    };
  }

  /**
   * Fallback parser using regex if DOMParser is unavailable (e.g. Node test runner)
   */
  private static parseWithRegex(html: string): UUERPExtractedData {
    const subjects: UUERPSubjectAttendance[] = [];
    let overall: UERPOverallAttendance | undefined;

    // 1. Profile Extraction via Regex
    const profile: Partial<UUERPStudentProfile> = {
      university: 'Uttaranchal University',
    };

    const nameMatch = html.match(/(?:Student Name|Name)\s*[:\-]\s*([A-Za-z\s.]+?)(?:<|\n|$)/i);
    if (nameMatch) profile.studentName = nameMatch[1].trim();

    const rollMatch = html.match(/(?:Student ID|Roll No|Enrollment No)\s*[:\-]\s*([A-Za-z0-9]+?)(?:<|\n|$)/i);
    if (rollMatch) profile.studentId = rollMatch[1].trim();

    const progMatch = html.match(/(?:Program|Course|Branch)\s*[:\-]\s*([A-Za-z0-9\s().-]+?)(?:<|\n|$)/i);
    if (progMatch) profile.program = progMatch[1].trim();

    const semMatch = html.match(/(?:Semester|Sem)\s*[:\-]\s*(\d+)/i);
    if (semMatch) profile.semester = parseInt(semMatch[1], 10);

    // 2. Table Header Mapping
    let subIndex = -1;
    let codeIndex = -1;
    let facultyIndex = -1;
    let conductedIndex = -1;
    let presentIndex = -1;
    let pctIndex = -1;

    const thMatches = html.match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || [];
    if (thMatches.length > 0) {
      const headers = thMatches.map((th) => th.replace(/<[^>]+>/g, '').trim().toLowerCase());
      codeIndex = headers.findIndex((h) => h.includes('code'));
      subIndex = headers.findIndex(
        (h) =>
          (h.includes('name') || h.includes('subject') || h.includes('course') || h.includes('paper') || h.includes('title')) &&
          !h.includes('code')
      );
      if (subIndex === -1 && codeIndex !== -1) {
        subIndex = headers.findIndex((h) => h.includes('subject') || h.includes('course'));
      }
      facultyIndex = headers.findIndex((h) => h.includes('faculty') || h.includes('teacher'));
      conductedIndex = headers.findIndex(
        (h) => h.includes('conducted') || h.includes('total lecture') || h.includes('total class') || h.includes('total')
      );
      presentIndex = headers.findIndex(
        (h) => h.includes('attended') || h.includes('present') || h.includes('att.')
      );
      pctIndex = headers.findIndex((h) => h.includes('%') || h.includes('percentage') || h.includes('percent'));
    }

    // 3. Process Table Rows
    const trMatches = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    for (const tr of trMatches) {
      // Skip header row
      if (tr.includes('<th')) continue;

      const tdMatches = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      if (tdMatches.length < 3) continue;

      const cleanTds = tdMatches.map((td) => td.replace(/<[^>]+>/g, '').trim());
      const rowText = cleanTds.join(' ').toLowerCase();
      const isTotalRow = rowText.includes('total') || rowText.includes('overall') || rowText.includes('grand');

      // Extract numbers
      const numbers = cleanTds.map((t) => parseFloat(t.replace('%', ''))).filter((n) => !isNaN(n));

      if (isTotalRow) {
        const totalLectures = conductedIndex !== -1 ? parseInt(cleanTds[conductedIndex], 10) : numbers[0] || 0;
        const totalPresent = presentIndex !== -1 ? parseInt(cleanTds[presentIndex], 10) : numbers[1] || 0;
        const percentage = pctIndex !== -1 ? parseFloat(cleanTds[pctIndex].replace('%', '')) : numbers[2] || 0;

        overall = {
          totalLectures: isNaN(totalLectures) ? 0 : totalLectures,
          totalPresent: isNaN(totalPresent) ? 0 : totalPresent,
          percentage: isNaN(percentage) ? 0 : percentage,
        };
        continue;
      }

      // Regular Subject Row
      const subName =
        subIndex !== -1 && cleanTds[subIndex]
          ? cleanTds[subIndex]
          : cleanTds.find((t) => t.length > 4 && isNaN(Number(t)));
      const subCode = codeIndex !== -1 ? cleanTds[codeIndex] : `SUB-${subjects.length + 1}`;
      const faculty = facultyIndex !== -1 ? cleanTds[facultyIndex] : '';

      const rawConducted = conductedIndex !== -1 ? parseInt(cleanTds[conductedIndex], 10) : numbers[0] || 0;
      const rawPresent = presentIndex !== -1 ? parseInt(cleanTds[presentIndex], 10) : numbers[1] || 0;
      const rawPct =
        pctIndex !== -1
          ? parseFloat(cleanTds[pctIndex].replace('%', ''))
          : rawConducted > 0
          ? (rawPresent / rawConducted) * 100
          : 0;

      if (subName && subName.length >= 2 && !isNaN(rawConducted)) {
        const conducted = isNaN(rawConducted) ? 0 : rawConducted;
        const present = isNaN(rawPresent) ? 0 : rawPresent;
        const pct = isNaN(rawPct)
          ? conducted > 0
            ? parseFloat(((present / conducted) * 100).toFixed(2))
            : 0
          : parseFloat(rawPct.toFixed(2));

        const safeMisses = Math.max(0, Math.floor(present / 0.75) - conducted);
        const recoveryNeeded = pct < 75 ? Math.ceil((0.75 * conducted - present) / 0.25) : 0;

        subjects.push({
          subjectId: subCode.toLowerCase().replace(/[^a-z0-9]/g, '-') || `uu-${subjects.length + 1}`,
          code: subCode,
          name: subName,
          faculty,
          totalConducted: conducted,
          totalPresent: present,
          percentage: pct,
          safeMisses,
          recoveryNeeded,
        });
      }
    }

    if (!overall && subjects.length > 0) {
      const sumConducted = subjects.reduce((sum, s) => sum + s.totalConducted, 0);
      const sumPresent = subjects.reduce((sum, s) => sum + s.totalPresent, 0);
      const percentage = sumConducted > 0 ? parseFloat(((sumPresent / sumConducted) * 100).toFixed(2)) : 0;

      overall = {
        totalLectures: sumConducted,
        totalPresent: sumPresent,
        percentage,
      };
    }

    return {
      profile,
      overall,
      subjects,
      rawHtmlLength: html.length,
      extractedAt: new Date().toISOString(),
    };
  }

  /**
   * Extracts student details from portal layout headers or profile card
   */
  private static extractProfile(doc: Document): Partial<UUERPStudentProfile> {
    const profile: Partial<UUERPStudentProfile> = {
      university: 'Uttaranchal University',
    };

    const textContent = doc.body?.innerText || doc.body?.textContent || '';

    // Search for Student Name
    const nameMatch =
      textContent.match(/(?:Student Name|Name)\s*[:\-]\s*([A-Za-z\s.]+)/i) ||
      doc.querySelector('#lblStudentName, .student-name, #lbl_StudentName')?.textContent?.trim();
    if (nameMatch) {
      profile.studentName = typeof nameMatch === 'string' ? nameMatch : nameMatch[1]?.trim();
    }

    // Search for Student Roll / ID
    const rollMatch =
      textContent.match(/(?:Student ID|Roll No|Enrollment No)\s*[:\-]\s*([A-Za-z0-9]+)/i) ||
      doc.querySelector('#lblRollNo, .student-roll, #lbl_RollNo')?.textContent?.trim();
    if (rollMatch) {
      profile.studentId = typeof rollMatch === 'string' ? rollMatch : rollMatch[1]?.trim();
    }

    // Search for Program / Course
    const programMatch =
      textContent.match(/(?:Program|Course|Branch)\s*[:\-]\s*([A-Za-z0-9\s().-]+)/i) ||
      doc.querySelector('#lblCourse, .student-program')?.textContent?.trim();
    if (programMatch) {
      profile.program = typeof programMatch === 'string' ? programMatch : programMatch[1]?.trim();
    }

    // Search for Semester
    const semMatch = textContent.match(/(?:Semester|Sem)\s*[:\-]\s*(\d+)/i);
    if (semMatch) {
      profile.semester = parseInt(semMatch[1], 10);
    }

    return profile;
  }

  /**
   * Extracts attendance tables and computes subject-wise + overall numbers
   */
  private static extractAttendanceTables(doc: Document): {
    subjects: UUERPSubjectAttendance[];
    overall?: UERPOverallAttendance;
  } {
    const subjects: UUERPSubjectAttendance[] = [];
    let overall: UERPOverallAttendance | undefined;

    const tables = Array.from(doc.querySelectorAll('table'));

    for (const table of tables) {
      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length < 2) continue;

      // Identify header row and map columns
      const headerRow = rows.find((r) => r.querySelectorAll('th').length > 0) || rows[0];
      const headers = Array.from(headerRow.querySelectorAll('th, td')).map((h) =>
        (h.textContent || '').trim().toLowerCase()
      );

      const codeIndex = headers.findIndex((h) => h.includes('code'));
      let subIndex = headers.findIndex(
        (h) =>
          (h.includes('name') || h.includes('subject') || h.includes('course') || h.includes('paper') || h.includes('title')) &&
          !h.includes('code')
      );
      if (subIndex === -1 && codeIndex !== -1) {
        subIndex = headers.findIndex((h) => h.includes('subject') || h.includes('course'));
      }
      const facultyIndex = headers.findIndex(
        (h) => h.includes('faculty') || h.includes('teacher')
      );
      const conductedIndex = headers.findIndex(
        (h) =>
          h.includes('conducted') ||
          h.includes('total lecture') ||
          h.includes('total class') ||
          h.includes('total')
      );
      const presentIndex = headers.findIndex(
        (h) =>
          h.includes('attended') ||
          h.includes('present') ||
          h.includes('att.') ||
          h.includes('attend')
      );
      const pctIndex = headers.findIndex(
        (h) => h.includes('%') || h.includes('percentage') || h.includes('percent')
      );

      if (subIndex === -1 && conductedIndex === -1) {
        continue; // Not an attendance table
      }

      // Process body rows
      for (const row of rows) {
        if (row === headerRow) continue;
        const cells = Array.from(row.querySelectorAll('td')).map((c) =>
          (c.textContent || '').trim()
        );
        if (cells.length < 3) continue;

        const rowText = cells.join(' ').toLowerCase();
        const isTotalRow =
          rowText.includes('total') || rowText.includes('overall') || rowText.includes('grand');

        // Extract values
        const rawSubName = subIndex !== -1 ? cells[subIndex] : '';
        const rawSubCode = codeIndex !== -1 ? cells[codeIndex] : '';
        const rawFaculty = facultyIndex !== -1 ? cells[facultyIndex] : '';
        const rawConducted = conductedIndex !== -1 ? parseInt(cells[conductedIndex], 10) : NaN;
        const rawPresent = presentIndex !== -1 ? parseInt(cells[presentIndex], 10) : NaN;

        let rawPct =
          pctIndex !== -1 ? parseFloat(cells[pctIndex].replace('%', '')) : NaN;

        // If total/overall row
        if (isTotalRow && (!isNaN(rawConducted) || !isNaN(rawPct))) {
          const totalLectures = isNaN(rawConducted) ? 0 : rawConducted;
          const totalPresent = isNaN(rawPresent) ? 0 : rawPresent;
          const percentage = !isNaN(rawPct)
            ? rawPct
            : totalLectures > 0
            ? parseFloat(((totalPresent / totalLectures) * 100).toFixed(2))
            : 0;

          overall = {
            totalLectures,
            totalPresent,
            percentage,
          };
          continue;
        }

        // Validate regular subject row
        if (!rawSubName || rawSubName.length < 2) continue;
        if (isNaN(rawConducted) && isNaN(rawPresent)) continue;

        const conducted = isNaN(rawConducted) ? 0 : rawConducted;
        const present = isNaN(rawPresent) ? 0 : rawPresent;
        const pct = !isNaN(rawPct)
          ? rawPct
          : conducted > 0
          ? parseFloat(((present / conducted) * 100).toFixed(2))
          : 0;

        const safeMisses = Math.max(0, Math.floor(present / 0.75) - conducted);
        const recoveryNeeded =
          pct < 75 ? Math.ceil((0.75 * conducted - present) / 0.25) : 0;

        const subjectId =
          rawSubCode.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() ||
          `uu-sub-${subjects.length + 1}`;

        subjects.push({
          subjectId,
          code: rawSubCode || `UU-${subjects.length + 1}`,
          name: rawSubName,
          faculty: rawFaculty,
          totalConducted: conducted,
          totalPresent: present,
          percentage: pct,
          safeMisses,
          recoveryNeeded,
        });
      }
    }

    // If overall attendance was not found in a table row, calculate from subject sum
    if (!overall && subjects.length > 0) {
      const sumConducted = subjects.reduce((sum, s) => sum + s.totalConducted, 0);
      const sumPresent = subjects.reduce((sum, s) => sum + s.totalPresent, 0);
      const percentage =
        sumConducted > 0 ? parseFloat(((sumPresent / sumConducted) * 100).toFixed(2)) : 0;

      overall = {
        totalLectures: sumConducted,
        totalPresent: sumPresent,
        percentage,
      };
    }

    return { subjects, overall };
  }
}
