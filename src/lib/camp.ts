import { Transform } from "./data";

export const COHORT_TO_GROUP = {
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

/** 2025 */
export const WEEKS = [
  "June 30 - July 3",
  "July 7 - July 11",
  "July 14 - July 18",
  "July 21 - July 25",
  "July 28 - August 1",
  "August 4 - August 8",
  "August 11 - August 15",
];

export const SECTION_HEADERS = [
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
  "1-Week Camp: Week options",
  "1-Week Camp: Extended Hours",
];

export const calculateAgeAndCohort: Transform = (report) => {
  const referenceDate = new Date("06/26/2024");

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
    const found = Object.entries(COHORT_TO_GROUP).find(([descriptor]) => {
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
    });

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

export const assignWeeks: Transform = (report) => {
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
      (row["Sections"] as string).replace("Full ", "")[0],
      10
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

export const assignSource: Transform = (report) => {
  report.rows.forEach((row) => {
    row["Source"] = SECTION_HEADERS.some(
      (col) => row[col] && (row[col] as string).includes("Full Day")
    )
      ? "FED"
      : "Rec Prog";
  });
};
