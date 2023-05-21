import { ParseResult, parse, unparse } from "papaparse";

export type Header = string;
// type Header = (typeof HEADERS)[number];

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

export type RegistrationRowArray = (string | number | boolean | null)[];
export type RegistrationRow = Record<Header, string | number | boolean | null>;
export type RowWarnings = Record<number, string[]>;
export type CellWarnings = Record<number, Record<Header, string[]>>;

/** A function that transforms row and header data. */
type Transform = (
  headers: Header[],
  rows: RegistrationRow[]
) => [string[], RegistrationRow[], RowWarnings, CellWarnings];

/** Given a value, returns a general display string. */
export const toDisplayValue = (val: string | number | boolean | null) => {
  switch (typeof val) {
    case "number":
      return val.toString();
    case "string":
      return val.trim().length > 50
        ? val.trim().slice(0, 50) + "..."
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
): Promise<ParseResult<RegistrationRow>> {
  // Promisify papaparse's parse functions
  return new Promise((resolve, reject) => {
    parse<RegistrationRowArray>(file, {
      // Convert numbers and booleans
      dynamicTyping: true,
      complete(results, file) {
        let [headers, ...rowArrays] = results.data;

        // Remove empty last row
        rowArrays.pop();

        let rows = mergeRepeatedColumns(headers as string[], rowArrays);

        // Remove duplicate headers
        headers = [...new Set(headers)];

        // Apply transformations
        [headers, rows] = applyTransforms(
          headers as Header[],
          rows,
          removeColumns,
          castColumns,
          calculateAgeAndCohort,
          assignWeeks,
          assignSource,
          assignContact,
          aggregateSignOffs,
          assignFormStatus,
          sandbox
        );
        results.meta.fields = headers as string[];
        return resolve({
          data: rows,
          errors: results.errors,
          meta: results.meta,
        });
      },
      error(error, file) {
        return reject(error);
      },
    });
  });
}

/** Merges any duplicate columns and turns row arrays into row objects. */
export function mergeRepeatedColumns(
  headers: string[],
  data: RegistrationRowArray[]
) {
  const objectRows: RegistrationRow[] = [];
  for (const row of data) {
    /** The row of data in combined object form with headers as keys. */
    const objectRow: RegistrationRow = {};

    // Iterate through
    row.forEach((val, headerIndex) => {
      const header = headers[headerIndex];

      // Check if we already have data for this header in this row, and we have new data
      if (objectRow[header]) {
        console.warn("Found dup column", {
          header,
        });
        if (val) {
          console.warn(`Overwriting data from duplicate columns`, {
            header,
            currentValue: objectRow[header],
            newValue: val,
          });
        }
      }

      // Trim all strings
      if (typeof val === "string") {
        val = val.trim();

        // Convert strings to bools
        if (val.startsWith("Yes,") || val === "Yes") {
          val = true;
        } else if (val.startsWith("No,") || val === "No") {
          val = false;
        }
      }

      if (!objectRow[header] && val) {
        objectRow[header] = val;
      }
    });

    objectRows.push(objectRow);
  }
  return objectRows;
}

/** Applies given transforms in order on the data. */
export function applyTransforms(
  headers: string[],
  rows: RegistrationRow[],
  ...transforms: Transform[]
): [string[], RegistrationRow[]] {
  const rowWarnings: RowWarnings = {};
  const cellWarnings: CellWarnings = {};
  for (const transform of transforms) {
    const [newHeaders, newRows, newRowWarnings, newCellWarnings] = transform(
      headers,
      rows
    );
    headers = newHeaders;
    rows = newRows;

    for (let rowIndex in newRowWarnings) {
      if (!rowWarnings[rowIndex]) {
        rowWarnings[rowIndex] = [];
      }
      rowWarnings[rowIndex] = rowWarnings[rowIndex].concat(
        newRowWarnings[rowIndex]
      );
    }

    for (let rowIndex in newCellWarnings) {
      if (!cellWarnings[rowIndex]) {
        cellWarnings[rowIndex] = {};
      }
      const newCellWarning = newCellWarnings[rowIndex];
      for (const header in newCellWarning) {
        if (!cellWarnings[rowIndex][header]) {
          cellWarnings[rowIndex][header] = [];
        }
        cellWarnings[rowIndex][header] = cellWarnings[rowIndex][header].concat(
          newCellWarning[header]
        );
      }
    }
  }

  return [headers, rows];
}

/** Returns a object URL for the row data in a CSV file.  */
export const downloadAsCSV = (
  headers: string[],
  rows: RegistrationRow[],
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

export const calculateAgeAndCohort: Transform = (headers, rows) => {
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

  const transformedRows = rows.map((row) => {
    const birthDate = new Date(row["Participant Birth date"] as string);
    const newAge = calculateAge(birthDate);

    if (row["Participant Age"] !== newAge) {
      console.warn(`HAPPY ${row["Participant Age"]}->${newAge} BIRTHDAY`);
    }
    row["Participant Age"] = newAge;

    // Find proper cohort based on age at start of program
    const found = Object.entries(COHORT_TO_GROUP).find(
      ([descriptor, cohortName]) => {
        // descriptor = "4 yo boys" / "5-6 yo girls", we want [4] / [5, 6]
        const ages = descriptor
          .split(" ")[0]
          .split("-")
          .map((c) => parseInt(c));

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

      return row;
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
      row["Participant Gender"] == "male" ? "Boys" : "Girls";
    row["Cohort"] = descriptor;
    row["Cohort Group Name"] = cohortName;

    return row;
  });

  return [headers.concat("Cohort Group Name"), transformedRows, {}, {}];
};

const removeColumns: Transform = (
  headers: string[],
  data: RegistrationRow[]
) => {
  for (const row of data) {
    delete row["Text"];
  }
  return [headers.filter((h) => h !== "Text"), data, {}, {}];
};

const assignWeeks: Transform = (headers, rows) => {
  const newRows = rows.map((row) => {
    let weeks = new Set<string>();

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
      (row["Sections"] as string).replace("Full ", "")[0]
    );

    if (weeks.size !== paidWeeks) {
      console.error(`Difference in selected vs paid weeks`, {
        weeks,
        paidWeeks,
        row,
      });
    }

    return row;
  });
  return [
    [...WEEKS.map((_, i) => `Week ${i + 1}`), ...headers, "Weeks"],
    newRows,
    {},
    {},
  ];
};

const assignSource: Transform = (headers, rows) => {
  const newRows = rows.map((row) => {
    row["Source"] = SECTION_HEADERS.some(
      (col) => row[col] && (row[col] as string).includes("Full Day")
    )
      ? "FED"
      : "Rec Prog";
  });
  return [headers.concat("Source"), rows, {}, {}];
};

const assignContact: Transform = (headers, rows) => {
  rows.forEach((row) => {
    row[
      "Contact"
    ] = `${row["Participant First Name"]} ${row["Participant Last Name"]}`;
  });
  return [headers.concat("Contact"), rows, {}, {}];
};

const aggregateSignOffs: Transform = (headers, rows) => {
  rows.forEach((row) => {
    row["General Maritime: Sign Off"] =
      row[
        "Maritime Waterfront Swimming Program Authorization Release for ages 5-14: Sign Off"
      ] ||
      row[
        "Maritime Waterfront Activities Program Authorization Release for ages 9-14: Sign Off"
      ];
  });
  return [headers.concat("General Maritime: Sign Off"), rows, {}, {}];
};

const assignFormStatus: Transform = (headers, rows) => {
  rows.forEach((row) => {
    // row["Form Status"] =
  });
  return [headers.concat("Form Status"), rows, {}, {}];
};

const castColumns: Transform = (headers, rows) => {
  const boolColumns = headers.filter((h) => h.endsWith(": Sign Off"));

  rows.forEach((row) => {
    boolColumns.forEach((col) => (row[col] = Boolean(row[col])));
  });
  return [headers, rows, {}, {}];
};

const sandbox: Transform = (headers, rows) => {
  // ----
  // SANDBOX

  for (const row of rows) {
    if (row["Participant First Name"] === "Sinead") {
      console.log(row);
    }
  }
  // ----

  return [headers, rows, {}, {}];
};
