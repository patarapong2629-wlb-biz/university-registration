import { faker } from "@faker-js/faker";
import fs from "fs";
import path from "path";

import { mockFaculties, mockCourses } from "./mock/index.js";

const maxFaculties = mockFaculties.length;
const totalFaculties = parseInt(process.env.TOTAL_FACULTIES);

if (totalFaculties > maxFaculties) {
  throw new Error(
    `Environment input ${totalFaculties} faculties over the limit ${maxFaculties} faculties.`
  );
}

const file = "/app/output/tearup/university/data.sql";
const dir = path.dirname(file);

// Ensure directory exists
fs.mkdirSync(dir, { recursive: true });

let sql = "USE university;\n\n";

// Insert faculties
sql += "INSERT INTO faculties (name, description) VALUES";

const shuffledFaculties = faker.helpers.shuffle(mockFaculties);
const faculties = shuffledFaculties.slice(0, parseInt(totalFaculties));

const departments = [];
let facultyId = 1;
let departmentId = 1;

for (const {
  facultyName,
  facultyDescription,
  departments: mockDepartments,
} of faculties) {
  sql += `\n  ("${facultyName}", "${facultyDescription}"),`;

  for (const department of mockDepartments) {
    departments.push({ facultyName, facultyId, departmentId, ...department });
    departmentId++;
  }

  facultyId++;
}

sql = sql.replace(/,$/, ";") + "\n\n";

// Insert departments
sql += "INSERT INTO departments (name, description, faculty_id) VALUES";

for (const {
  departmentName,
  departmentDescription,
  facultyId,
} of departments) {
  sql += `\n  ("${departmentName}", "${departmentDescription}", ${facultyId}),`;
}

sql = sql.replace(/,$/, ";") + "\n\n";

// Insert students
sql +=
  "INSERT INTO students (first_name, last_name, faculty_id, department_id, academic_year) VALUES";

const totalStudents = parseInt(process.env.TOTAL_STUDENTS);
const totalDepartments = departments.length;
const studentsPerDepartment = Math.floor(totalStudents / totalDepartments);
const remainingStudents = totalStudents % totalDepartments;
const sixYearPrograms = [
  "Faculty of Medicine",
  "Faculty of Pharmacy",
  "Faculty of Veterinary Medicine",
];
const students = [];
let studentId = 1;

for (const { facultyName, facultyId, departmentId } of departments) {
  const maxAcademicYear = sixYearPrograms.includes(facultyName) ? 6 : 4;
  const studentsPerDepartmentPerAcademicYear = Math.floor(
    studentsPerDepartment / maxAcademicYear
  );
  const remainingStudentsPerDepartment =
    studentsPerDepartment % maxAcademicYear;

  for (let academicYear = 1; academicYear <= maxAcademicYear; academicYear++) {
    for (let i = 0; i < studentsPerDepartmentPerAcademicYear; i++) {
      const firstName = faker.person.firstName().replace("'", "");
      const lastName = faker.person.lastName().replace("'", "");

      sql += `\n  ("${firstName}", "${lastName}", ${facultyId}, ${departmentId}, ${academicYear}),`;

      students.push({
        studentId,
        departmentId,
        academicYear,
      });

      studentId++;
    }
  }

  for (let i = 0; i < remainingStudentsPerDepartment; i++) {
    const firstName = faker.person.firstName().replace("'", "");
    const lastName = faker.person.lastName().replace("'", "");
    const academicYear = faker.number.int({ min: 1, max: maxAcademicYear });

    sql += `\n  ("${firstName}", "${lastName}", ${facultyId}, ${departmentId}, ${academicYear}),`;

    students.push({
      studentId,
      departmentId,
      academicYear,
    });

    studentId++;
  }
}

for (let i = 0; i < remainingStudents; i++) {
  const { facultyName, facultyId, departmentId } = departments[i];
  const maxAcademicYear = sixYearPrograms.includes(facultyName) ? 6 : 4;
  const firstName = faker.person.firstName().replace("'", "");
  const lastName = faker.person.lastName().replace("'", "");
  const academicYear = faker.number.int({ min: 1, max: maxAcademicYear });

  sql += `\n  ("${firstName}", "${lastName}", ${facultyId}, ${departmentId}, ${academicYear}),`;

  students.push({
    studentId,
    departmentId,
    academicYear,
  });

  studentId++;
}

sql = sql.replace(/,$/, ";") + "\n\n";

// Insert courses
sql += "INSERT INTO courses (code, name, credits) VALUES";

for (const { code, name, credits } of mockCourses) {
  sql += `\n  ("${code}", "${name}", ${credits}),`;
}

sql = sql.replace(/,$/, ";") + "\n\n";

// Insert registrations
sql +=
  "INSERT INTO registrations (student_id, course_code, registration_type, year, semester, status) VALUES";
const allRegistrationParts = [];

const registrationSemester = parseInt(process.env.REGISTRATION_SEMESTER);
const MAX_CREDITS_PER_SEMESTER = 24;
const yearMap = {
  1: "firstYear",
  2: "secondYear",
  3: "thirdYear",
  4: "fourthYear",
  5: "fifthYear",
  6: "sixthYear",
};
const semesterMap = {
  1: "firstSemester",
  2: "secondSemester",
};
const currentYear = new Date().getFullYear();

const generateSemesterRegistrations = ({
  student,
  year,
  semester,
  departments,
  mockCourses,
  faker,
}) => {
  let semesterSql = "";
  let totalCredits = 0;
  const { studentId, departmentId } = student;

  const department = departments.find((d) => d.departmentId === departmentId);
  const yearPlan = department.studyPlan[yearMap[year]];
  const semesterPlan = yearPlan?.[semesterMap[semester]];

  if (!semesterPlan) {
    throw new Error(
      `Not found study plan for department ${department.departmentName} year ${yearMap[year]} semester ${semesterMap[semester]}`
    );
  }

  const { required, elective } = semesterPlan;

  // Required courses
  for (const courseCode of required) {
    const course = mockCourses.find(({ code }) => code === courseCode);
    if (!course) {
      throw new Error(`Not found required course with code ${courseCode}.`);
    }
    totalCredits += course.credits;

    const registrationType = faker.helpers.weightedArrayElement([
      { weight: 9, value: "PRE-REGISTRATION" },
      { weight: 1, value: "NORMAL" },
    ]);
    const status = faker.helpers.weightedArrayElement([
      { weight: 9, value: "REGISTERED" },
      { weight: 1, value: "WITHDRAWN" },
    ]);

    semesterSql += `\n  (${studentId}, "${courseCode}", "${registrationType}", ${
      currentYear - student.academicYear + year
    }, ${semester}, "${status}"),`;
  }

  // Elective courses (only if under the credit limit)
  if (totalCredits < MAX_CREDITS_PER_SEMESTER && elective.length > 0) {
    const willEnrollInElectives = Math.random() < 0.8; // 80% chance

    if (willEnrollInElectives) {
      const shuffledElectives = faker.helpers.shuffle(elective);
      const electivesToAttempt = faker.number.int({
        min: 1,
        max: shuffledElectives.length,
      });
      let electivesRegistered = 0;

      for (const courseCode of shuffledElectives) {
        if (electivesRegistered >= electivesToAttempt) break;

        const course = mockCourses.find(({ code }) => code === courseCode);
        if (!course) {
          throw new Error(`Not found elective course with code ${courseCode}.`);
        }

        if (totalCredits + course.credits <= MAX_CREDITS_PER_SEMESTER) {
          totalCredits += course.credits;
          electivesRegistered++;

          const registrationType = faker.helpers.weightedArrayElement([
            { weight: 9, value: "PRE-REGISTRATION" },
            { weight: 1, value: "NORMAL" },
          ]);
          const status = faker.helpers.weightedArrayElement([
            { weight: 9, value: "REGISTERED" },
            { weight: 1, value: "WITHDRAWN" },
          ]);

          semesterSql += `\n  (${studentId}, "${courseCode}", "${registrationType}", ${
            currentYear - student.academicYear + year
          }, ${semester}, "${status}"),`;
        }
      }
    }
  }

  return semesterSql;
};

for (const student of students) {
  for (let year = 1; year <= student.academicYear; year++) {
    for (let semester = 1; semester <= 2; semester++) {
      // Skip if this is the current (or future) semester
      if (year === student.academicYear && semester >= registrationSemester) {
        continue;
      }

      const semesterRegistrations = generateSemesterRegistrations({
        student,
        year,
        semester,
        departments,
        mockCourses,
        faker,
      });

      if (semesterRegistrations) {
        allRegistrationParts.push(semesterRegistrations);
      }
    }
  }
}

if (allRegistrationParts.length > 0) {
  sql += allRegistrationParts.join("").slice(0, -1); // Join and remove the final trailing comma
  sql += ";";
}

try {
  fs.writeFileSync(file, sql, "utf8");
} catch (err) {
  throw new Error("Error generate university data SQL file:", err);
}
