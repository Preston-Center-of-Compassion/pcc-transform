import { parse, unparse } from "papaparse";

export type CellValue = string | boolean | number | null | undefined;
export type Header = string;
export type Row = Record<Header, CellValue>;
export type Report = {
  headers: Header[];
  rows: Row[];
}

const COHORT_TO_GROUP = {
  "5-6 girls": "Candyland",
  "4 yo girls": "Chutes and Ladders",
  "7-8 girls": "Connect4",
  "9-10 girls": "Mancala",
  "5-6 boys": "Monopoly",
  "4 yo boys": "Operation",
  "7-8 boys": "Risk",
  "9-10 boys": "Scrabble",
  "11-13 boys": "Trouble",
  "11-13 girls": "Twister",
} as const;

const WEEKS = [
  "June 26 - June 30",
  "July 3 - July 7",
  "July 10 - July 14",
  "July 17 - July 21",
  "July 24 - July 28",
  "July 31 - August 4",
  "August 7 - August 11",
];

const SECTION_HEADERS = [
  "Full 7-Week Camp: Extended Hours",
  "6-Week Camp: Week options",
  "6-Week Camp: Extended Hours",
  "5-Week Camp: Week options",
  "5-Week Camp: Extended Hours",
  "4-Week Camp: Week options",
  "4-Week Camp: Extended Hours",
  "4-Week Camp: Extended Hours",
  "3-Week Camp: Week options",
  "3-Week Camp: Extended Hours",
  "2-Week Camp: Week options",
  "2-Week Camp: Extended Hours",
];



/** A function that transforms row and header data. */
type Transform = (
  report: Report,
) => void;

export const sanitizeValue = (val: CellValue): CellValue => {
  if (typeof val === "string") {
    val = val.trim();

    // Convert strings to bools
    if (val.startsWith("Yes,") || val === "Yes") {
      val = true;
    } else if (val.startsWith("No,") || val === "No") {
      val = false;
    }
  }
  return val;
}

/** Given a value, returns a general display string. */
export const toDisplayValue = (val: CellValue) => {
  switch (typeof val) {
    case "number":
      return val.toString();
    case "string":
      return val.trim().length > 50
        ? `${val.trim().slice(0, 50)  }...`
        : val.trim();
    case "boolean":
      return val ? "Yes" : "No";
    default:
      return "—";
  }
};

/** Given a File with CSV content, parses it and applies the needed transforms, returning the complete, transformed data. */
export function parseCSVFileFromInput(
  file: File
): Promise<Report> {
  // Promisify papaparse's parse functions
  return new Promise((resolve, reject) => {
    parse<CellValue[]>(file, {
      // Convert numbers and booleans
      dynamicTyping: true,
      complete(results) {
        const [rawHeaders, ...rowArrays] = results.data;

        // Remove empty last row
        rowArrays.pop();

        const report = createReport(rawHeaders as string[], rowArrays);

        console.log(report);
        

        // // Apply transformations
        applyTransforms(
          report,
          removeColumns,
          castSignOffColumns,
          calculateAgeAndCohort,
          assignWeeks,
          assignSource,
          assignContact,
          // assignFormStatus,
          sandbox
        );
        
        return resolve(report);
      },
      error(error) {
        return reject(error);
      },
    });
  });
}

/** Merges any duplicate columns and turns row arrays into row objects. */
export function createReport(
  headers: string[],
  rowArrays: CellValue[][]
): Report {
  return {
    headers: [...new Set(headers)],
    rows: rowArrays.map(rowArray => rowArray.reduce((row, value, headerIndex) => {
        // Iterate through value array (which corresponds to headers array)
        value = sanitizeValue(value);
        const header = headers[headerIndex];
  
        // Set value of cell if not yet set
        return {
          ...row,
          [header]: !row[header] && value ? value : row[header]
        }
      }, {})
    )
  }
}

/** Applies given transforms in order on the data. */
export function applyTransforms(
  report: Report,
  ...transforms: Transform[]
) {
  for (const transform of transforms) {
    transform(report);
    report.headers = [...new Set(report.rows.flatMap((row)=> Object.keys(row)))]
  }
}

/** Returns a object URL for the row data in a CSV file.  */
export const downloadAsCSV = (
  headers: Report["headers"],
  rows: Report["rows"],
  filename: string
) => {
  const data = unparse(
    {
      data: rows,
      fields: headers,
    },
    {
      quotes: true,
    }
  );

  const blob = new Blob([data], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
};

// TRANSFORMS

export const calculateAgeAndCohort: Transform = (report) => {
  const referenceDate = new Date("06/26/2023");

  function calculateAge(birthDate: Date) {
    let years = referenceDate.getFullYear() - birthDate.getFullYear();

    if (
      referenceDate.getMonth() < birthDate.getMonth() ||
      (referenceDate.getMonth() == birthDate.getMonth() &&
        referenceDate.getDate() < birthDate.getDate())
    ) {
      years--;
    }

    return years;
  }

  report.rows.forEach((row) => {
    const birthDate = new Date(row["Participant Birth date"] as string);
    const newAge = calculateAge(birthDate);

    if (row["Participant Age"] !== newAge) {
      console.warn(`HAPPY ${row["Participant Age"]}->${newAge} BIRTHDAY`);
    }
    row["Participant Age"] = newAge;

    // Find proper cohort based on age at start of program
    const found = Object.entries(COHORT_TO_GROUP).find(
      ([descriptor]) => {
        // descriptor = "4 yo boys" / "5-6 yo girls", we want [4] / [5, 6]
        const ages = descriptor
          .split(" ")[0]
          .split("-")
          .map((c) => parseInt(c, 10));

        // Handle edge cases where participant is 1 year out of accepted age ranges
        let adjustedAge = newAge;
        if (newAge > 13) {
          adjustedAge = 13;
        } else if (newAge < 4) {
          adjustedAge = 4;
        }
        return (
          (ages.includes(adjustedAge) ||
            (ages.length == 2 &&
              adjustedAge > ages[0] &&
              adjustedAge < ages[1])) &&
          descriptor.includes(
            row["Participant Gender"] == "male" ? "boys" : "girls"
          )
        );
      }
    );

    if (!found) {
      console.error(`Can't determine cohort for participant`, {
        age: newAge,
        gender: row["Participant Gender"] == "male" ? "boys" : "girls",
        oldCohort: row["Cohort"],
      });

      return;
    }

    const [descriptor, cohortName] = found;

    if (row["Cohort"] !== descriptor) {
      console.warn(`Overwriting incorrect cohort`, {
        age: newAge,
        gender: row["Participant Gender"] == "male" ? "boys" : "girls",
        oldCohort: row["Cohort"],
        newCohort: descriptor,
        newCohortName: cohortName,
      });
    }

    row["Participant Gender"] =
      row["Participant Gender"] == "male" ? "Male" : "Female";
    row["Cohort"] = descriptor;
    row["Cohort Group Name"] = cohortName;

  });
};

const removeColumns: Transform = (
  report
) => {
  for (const row of report.rows) {
    delete row["Text"];
  }
  report.headers = report.headers.filter((h) => h !== "Text");
};

const assignWeeks: Transform = (report) => {
  report.rows.forEach((row) => {
    const weeks = new Set<string>();

    WEEKS.forEach((weekSpan, weekIndex) => {
      const key = `Week ${weekIndex + 1}`;

      SECTION_HEADERS.forEach((sectionHeader) => {
        if (
          row["Sections"] === "Full 7-Week Camp" ||
          (row[sectionHeader] &&
            (row[sectionHeader] as string).includes(weekSpan))
        ) {
          row[key] = weekIndex + 1;
          weeks.add(weekSpan);
        }
      });
    });

    row["Weeks"] = Array.from(weeks).join(", ");

    const paidWeeks = parseInt(
      (row["Sections"] as string).replace("Full ", "")[0], 10
    );

    if (weeks.size !== paidWeeks) {
      console.error(`Difference in selected vs paid weeks`, {
        weeks,
        paidWeeks,
        row,
      });
    }
  });
};

const assignSource: Transform = (report) => {
  report.rows.forEach((row) => {
    row["Source"] = SECTION_HEADERS.some(
      (col) => row[col] && (row[col] as string).includes("Full Day")
    )
      ? "FED"
      : "Rec Prog";
  });
};

const assignContact: Transform = (report) => {
  report.rows.forEach((row) => {
    row[
      "Contact"
    ] = `${row["Participant First Name"]} ${row["Participant Last Name"]}`;
  });
};

// const assignFormStatus: Transform = (report) => {
//   report.rows.forEach((row) => {
//     // row["Form Status"] =
//   });
// };

const castSignOffColumns: Transform = (report) => {
  const boolColumns = report.headers.filter((h) => h.endsWith(": Sign Off"));

  report.rows.forEach((row) => {
    boolColumns.forEach((col) => (row[col] = Boolean(row[col])));
  });
};

const sandbox: Transform = (report) => {
  // ----
  // SANDBOX

  for (const row of report.rows) {
    if (row["Participant First Name"] === "Sinead") {
      console.log(row);
    }
  }
  // ----

};
