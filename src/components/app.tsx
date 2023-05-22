import { h, Fragment, createContext } from "preact";
import {
  StateUpdater,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "preact/hooks";
import { loadData, storeData } from "../storage";
import FilePicker from "./FilePicker";
import {
  Report,
  downloadAsCSV,
  parseCSVFileFromInput,
  toDisplayValue,
} from "../data";
import clsx from "clsx";

type HeadersMask = Record<string, boolean>;
type Data = {
  report: Report;
  headersMask: HeadersMask;
  setHeadersMask: StateUpdater<HeadersMask>;
  search: string;
  setSearch: StateUpdater<string>;
};

const Data = createContext<Data>({
  report: {
    headers: [],
    rows: []
  },
  headersMask: {},
  search: "",
  setSearch: null,
  setHeadersMask: null,
});

function Table({ className }: { className?: string }) {
  const { report, headersMask } = useContext(Data);

  return (
    <table class={clsx("text-center", className)}>
      <thead class="sticky top-0">
        <tr>
          {report.headers.map((header) => {
            if (headersMask[header]) {
              return (
                <th
                  key={header}
                  class="border border-white bg-gray-800  p-1 text-white"
                >
                  {header}
                </th>
              );
            }
            return null;
          })}
        </tr>
      </thead>
      <tbody>
        {report.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {report.headers.map((header) => {
              if (headersMask[header]) {
                return (
                  <td
                    key={header}
                    title={`${row[header]}`}
                    class={clsx(
                      !row[header] && "bg-red-100",
                      "border-t border-gray-300 p-1"
                    )}
                  >
                    {toDisplayValue(row[header])}
                  </td>
                );
              }
              return null;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Filters() {
  const { report, headersMask, search, setHeadersMask, setSearch } =
    useContext(Data);

  const toggleHeader = (header: string) => {
    const newHeadersMask = { ...headersMask, [header]: !headersMask[header] };
    setHeadersMask(newHeadersMask);
  };

  function reset() {
    const newHeadersMask = report.headers.reduce(
      (obj, header) => ({ ...obj, [header]: false }),
      {}
    );
    setHeadersMask(newHeadersMask);
  }

  const selectAll = () => {
    if (isFiltering) {
      const newHeadersMask = filteredHeaders.reduce(
        (obj, header) => ({ ...obj, [header]: true }),
        {}
      );
      setHeadersMask(newHeadersMask);
    }
  };

  const filteredHeaders = search.trim()
    ? report.headers.filter((header) =>
        header.toLowerCase().includes(search.toLowerCase())
      )
    : report.headers;
  const isFiltering =
    filteredHeaders.length !== report.headers.length && filteredHeaders.length > 0;

  return (
    <div class="mr-3 w-48">
      <div class="relative mb-3">
        <input
          type="text"
          name="search"
          class={"block border p-1"}
          placeholder={"Search"}
          value={search}
          onInput={(ev) => setSearch(ev.currentTarget.value)}
        />
        <p
          onClick={() => setSearch("")}
          class={"absolute right-1 top-1 cursor-pointer"}
        >
          ❌
        </p>
      </div>
      <div className="flex cursor-pointer items-center border bg-gray-100 p-2">
        <a href="#" class="flex-1 text-blue-600 underline" onClick={reset}>
          Reset
        </a>
        {isFiltering && (
          <a
            href="#"
            class="flex-1 text-blue-600 underline"
            onClick={selectAll}
          >
            Select All
          </a>
        )}
      </div>
      {filteredHeaders.map((header) => {
        return (
          <label
            key={header}
            // title={getSampleValues(header).join(", ")}
            class="flex cursor-pointer items-center border bg-gray-100 p-2"
          >
            <span class="flex-1">{header}</span>
            <input
              type="checkbox"
              checked={headersMask[header]}
              onChange={() => toggleHeader(header)}
            />
          </label>
        );
      })}
    </div>
  );
}

function Dashboard() {
  const { report: { headers, rows }, headersMask } = useContext(Data);

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

function App() {
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

      parseCSVFileFromInput(file).then((report) => {
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
      <div id="app">
        <main class={"mx-auto px-5 my-16 space-y-5"}>
          {!file && (
            <div>
              Download a CSV of the{" "}
              <a
                class="text-red-900 underline"
                target="_blank"
                href="https://www.familyid.com/organizations/11694/reports" rel="noreferrer"
              >
                Camp 2023 Report
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
      </div>
    </Data.Provider>
  );
}

export default App;
