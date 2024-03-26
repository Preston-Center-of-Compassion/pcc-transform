import { h, Fragment } from "preact";
import { useContext, useEffect, useMemo, useState } from "preact/hooks";
import { loadData, storeData } from "../lib/storage";
import FilePicker from "../components/FilePicker";
import {
  Report,
  assignContact,
  castSignOffColumns,
  downloadAsCSV,
  parseCSVFileFromInput,
  removeColumns,
} from "../lib/data";
import clsx from "clsx";
import { calculateAgeAndCohort, assignWeeks, assignSource } from "../lib/camp";
import { Data, Filters, HeadersMask, Table } from "../display";

function Dashboard() {
  const {
    report: { headers, rows },
    headersMask,
  } = useContext(Data);

  const filteredHeaders = headers.filter((header) => headersMask[header]);
  const isFiltering =
    filteredHeaders.length !== headers.length && filteredHeaders.length > 0;

  return (
    <>
      <div class="space-y-2">
        <div className="flex space-x-2">
          <a
            class={
              "block flex-1 rounded-md bg-red-900 px-6 py-3 text-center text-white drop-shadow-sm transition-all hover:bg-red-800"
            }
            href={"#"}
            onClick={() =>
              downloadAsCSV(
                headers,
                rows,
                `FAMILYID_IMPORT_FOR_ACT_${new Date().toDateString()}.csv`
              )
            }
          >
            CSV Download
          </a>
          {isFiltering && (
            <a
              class={
                "block flex-1 rounded-md bg-red-200 px-6 py-3 text-center text-red-900 drop-shadow-sm transition-all hover:bg-red-300"
              }
              href={"#"}
              onClick={() =>
                downloadAsCSV(
                  filteredHeaders,
                  rows,
                  `FAMILYID_IMPORT_FOR_ACT_${new Date().toDateString()}.csv`
                )
              }
            >
              Filtered CSV Download
            </a>
          )}
        </div>
      </div>

      <div class="flex">
        <Filters />
        <Table className="flex-1" />
      </div>
    </>
  );
}

function CampPage(props: { url?: string; path?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [search, setSearch] = useState<string>("");
  const [headersMask, setHeadersMask] = useState<HeadersMask>({});

  useEffect(() => {
    storeData("headersMask", headersMask);
  }, [headersMask]);

  const data = useMemo<Data>(
    () => ({
      report,
      headersMask,
      setHeadersMask,
      search,
      setSearch,
    }),
    [report, headersMask, setHeadersMask, search, setSearch]
  );

  const handleFiles = async (files: FileList) => {
    if (files && files.length > 0) {
      const file = files[0];
      setFile(file);

      parseCSVFileFromInput(file, [
        removeColumns,
        castSignOffColumns,
        calculateAgeAndCohort,
        assignWeeks,
        assignSource,
        assignContact,
      ]).then((report) => {
        console.log(report);

        setReport(report);
        setHeadersMask(
          loadData<HeadersMask>("headersMask") ??
            report.headers.reduce(
              (mask, header) => ({ ...mask, [header]: false }),
              {}
            )
        );
      });
    }
  };

  return (
    <Data.Provider value={data}>
      <main class={"mx-auto px-5 my-16 space-y-5"}>
        {!file && (
          <div>
            Download a CSV of the{" "}
            <a
              class="text-red-900 underline"
              target="_blank"
              href="https://students.arbitersports.com/organizations/11694/reports/1072445"
              rel="noreferrer"
            >
              Camp 2024 Report
            </a>{" "}
            from FamilyID first.
          </div>
        )}

        <FilePicker
          className={clsx(
            "p-10 transition-all duration-1000 ease-in-out",
            file ? "h-16" : "h-screen"
          )}
          accept=".csv"
          onChange={handleFiles}
          prompt="Drag and drop the FamilyID CSV report here."
        />

        {report && <Dashboard />}
      </main>
    </Data.Provider>
  );
}

export default CampPage;
