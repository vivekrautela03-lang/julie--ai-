import { describe, it, expect } from 'vitest';
import { UUERPParser } from '../services/integrations/uu-erp/parser';

describe('UUERPParser — Real Cyborg-ERP HTML Parser', () => {
  const sampleCyborgAttendanceHtml = `
    <!DOCTYPE html>
    <html>
    <head><title>Student Attendance</title></head>
    <body>
      <div class="profile-box">
        <span>Student Name : Vivek Rautela</span>
        <span>Roll No : UU21BBA1042</span>
        <span>Course : Bachelor of Business Administration (BBA)</span>
        <span>Semester : 4</span>
      </div>

      <div class="table-responsive">
        <table class="table table-bordered table-striped" id="gvAttendance">
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Subject Code</th>
              <th>Subject Name</th>
              <th>Faculty Name</th>
              <th>Total Conducted</th>
              <th>Total Attended</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>BBA-201</td>
              <td>Corporate and Business Law</td>
              <td>Dr. Namita</td>
              <td>20</td>
              <td>16</td>
              <td>80.00%</td>
            </tr>
            <tr>
              <td>2</td>
              <td>BBA-202</td>
              <td>Management Accounting</td>
              <td>Prof. Anupam Gupta</td>
              <td>15</td>
              <td>10</td>
              <td>66.67%</td>
            </tr>
            <tr>
              <td>3</td>
              <td>BBA-203</td>
              <td>Fundamentals of Digital Marketing</td>
              <td>Dr. Mohd Amir</td>
              <td>18</td>
              <td>15</td>
              <td>83.33%</td>
            </tr>
            <tr class="total-row">
              <td>Total</td>
              <td></td>
              <td>Overall Attendance</td>
              <td></td>
              <td>53</td>
              <td>41</td>
              <td>77.36%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;

  it('extracts student profile from HTML headers', () => {
    const data = UUERPParser.parseAttendancePage(sampleCyborgAttendanceHtml);
    expect(data.profile?.studentName).toBe('Vivek Rautela');
    expect(data.profile?.studentId).toBe('UU21BBA1042');
    expect(data.profile?.program).toBe('Bachelor of Business Administration (BBA)');
    expect(data.profile?.semester).toBe(4);
  });

  it('extracts all subjects and calculates percentages and safe misses', () => {
    const data = UUERPParser.parseAttendancePage(sampleCyborgAttendanceHtml);
    expect(data.subjects.length).toBe(3);

    const law = data.subjects.find((s) => s.code === 'BBA-201');
    expect(law).toBeDefined();
    expect(law?.name).toBe('Corporate and Business Law');
    expect(law?.totalConducted).toBe(20);
    expect(law?.totalPresent).toBe(16);
    expect(law?.percentage).toBe(80);
    expect(law?.safeMisses).toBe(1); // floor(16 / 0.75) - 20 = 21 - 20 = 1
    expect(law?.recoveryNeeded).toBe(0);

    const acct = data.subjects.find((s) => s.code === 'BBA-202');
    expect(acct).toBeDefined();
    expect(acct?.percentage).toBe(66.67);
    expect(acct?.recoveryNeeded).toBeGreaterThan(0); // below 75%
  });

  it('extracts overall attendance metrics', () => {
    const data = UUERPParser.parseAttendancePage(sampleCyborgAttendanceHtml);
    expect(data.overall).toBeDefined();
    expect(data.overall?.totalLectures).toBe(53);
    expect(data.overall?.totalPresent).toBe(41);
    expect(data.overall?.percentage).toBe(77.36);
  });

  it('gracefully handles empty or non-HTML strings without errors', () => {
    const emptyData = UUERPParser.parseAttendancePage('');
    expect(emptyData.subjects).toEqual([]);
    expect(emptyData.rawHtmlLength).toBe(0);
  });

  it('correctly parses copied tab-separated or plain-text table data', () => {
    const samplePlainText = `
Student Name : Vivek Rautela
Roll No : UU21BBA1042
Program : Bachelor of Business Administration
Semester : 4

S.No.	Subject Code	Subject Name	Faculty Name	Total Conducted	Attended	Percentage
1	TCS-601	Compiler Design	Dr. Sharma	30	25	83.33%
2	TCS-602	Computer Networks	Prof. Gupta	28	22	78.57%
3	TCS-603	Web Technologies	Dr. Verma	32	20	62.5%
Total Lectures: 90	Total Attended: 67	74.44%
    `;

    const parsed = UUERPParser.parseAttendancePage(samplePlainText);
    expect(parsed.profile?.studentName).toBe('Vivek Rautela');
    expect(parsed.profile?.studentId).toBe('UU21BBA1042');
    expect(parsed.subjects.length).toBe(3);

    const sub1 = parsed.subjects.find((s) => s.code === 'TCS-601');
    expect(sub1).toBeDefined();
    expect(sub1?.name).toBe('Compiler Design');
    expect(sub1?.totalConducted).toBe(30);
    expect(sub1?.totalPresent).toBe(25);
    expect(sub1?.percentage).toBe(83.33);

    const sub3 = parsed.subjects.find((s) => s.code === 'TCS-603');
    expect(sub3).toBeDefined();
    expect(sub3?.percentage).toBe(62.5);
    expect(sub3?.recoveryNeeded).toBeGreaterThan(0);

    expect(parsed.overall).toBeDefined();
    expect(parsed.overall?.totalLectures).toBe(90);
    expect(parsed.overall?.totalPresent).toBe(67);
  });
});
