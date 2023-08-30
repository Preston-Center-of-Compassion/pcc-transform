import { parse, unparse } from "papaparse";

export type CellValue = string | boolean | number | null | undefined;
export type Header = string;
export type Row = Record<Header, CellValue>;
export type Report = {
  headers: Header[];
  rows: Row[];
}


/** A function that transforms row and header data. */
export type Transform = (
  report: Report,
) => void;

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
]

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
  file: File,
  transforms: Transform[]
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
          ...transforms,
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

export const removeColumns: Transform = (
  report
) => {
  for (const row of report.rows) {
    delete row["Text"];
  }
  report.headers = report.headers.filter((h) => h !== "Text");
};

export const fixWeirdCharacters: Transform = (report) => {
  for (const row of report.rows) {
    for (const header of report.headers) {
      if (typeof row[header] === "string") {
        row[header] = (row[header] as string).replace("’", "'")
      }
    }
  }
}


export const assignContact: Transform = (report) => {
  report.rows.forEach((row) => {
    row[
      "Contact"
    ] = `${row["Participant First Name"]} ${row["Participant Last Name"]}`;
  });
};

export const castSignOffColumns: Transform = (report) => {
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
