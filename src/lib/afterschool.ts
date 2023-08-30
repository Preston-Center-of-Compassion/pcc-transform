import { DAYS_OF_WEEK, Transform } from "./data";

const WEEKDAY_COLUMNS_TO_SEARCH = [
  "Afterschool Recreational Program: Recreational Program Options",
  "One day a week: Afterschool Options",
  "Two days a week: Afterschool Options",
  "Three days a week : Afterschool Options",
  "Four days a week - BEST VALUE!: Afterschool Options",
  "Five days a week (Fun Fridays) - BEST VALUE! : Afterschool Options"
]

export const assignProgram: Transform = (report) => {
  for (const row of report.rows) {
    row["Program"] = (row["Program Name"] as string).includes("Tutoring") ? "Tutoring" : "Recreation";
  }
}

export const assignDays: Transform = (report) => {
  for (const row of report.rows) {
    const selectedDays = [];
    for (const header of WEEKDAY_COLUMNS_TO_SEARCH) {
      for (let i = 0;i < DAYS_OF_WEEK.length; i++) {
        if (row[header] && (row[header] as string).includes(DAYS_OF_WEEK[i])) {
          selectedDays.push(`${i}.${DAYS_OF_WEEK[i].slice(0, 3)}`)
        }
      }
    }
    row["Day of Week"] = selectedDays.join(";");
 
    // resulting: 1.Mon;2.Tues;
  }
}