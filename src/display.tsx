import clsx from "clsx";
import { createContext, h } from "preact";
import { StateUpdater, useContext } from "preact/hooks";
import { toDisplayValue, Report } from "./lib/data";

export type HeadersMask = Record<string, boolean>;
export type Data = {
  report: Report;
  headersMask: HeadersMask;
  setHeadersMask: StateUpdater<HeadersMask>;
  search: string;
  setSearch: StateUpdater<string>;
};

export const Data = createContext<Data>({
  report: {
    headers: [],
    rows: [],
  },
  headersMask: {},
  search: "",
  setSearch: null,
  setHeadersMask: null,
});

export function Table({ className }: { className?: string }) {
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

export function Filters() {
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
    filteredHeaders.length !== report.headers.length &&
    filteredHeaders.length > 0;

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
