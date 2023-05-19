import { h } from "preact";
import { useRef, useState } from "preact/hooks";
import { clsx } from "clsx";

interface PropTypes {
  prompt?: string;
  className?: string;
  /** See https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept#unique_file_type_specifiers */
  accept?: string;
  /** Can upload multiple files */
  multiple?: boolean;
  onChange: (files: FileList) => void;
}

/**  */
export default function FilePicker({
  className,
  prompt,
  accept,
  multiple,
  onChange,
}: PropTypes) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState<string | null>(null);

  function handleDragOver(ev: DragEvent) {
    ev.stopPropagation();
    ev.preventDefault();
    if (ev.dataTransfer) {
      ev.dataTransfer.dropEffect = "copy";
    }
  }

  function handleDrop(ev: DragEvent) {
    ev.stopPropagation();
    ev.preventDefault();
    if (ev.dataTransfer?.files) {
      setFilename(
        Array.from(ev.dataTransfer.files)
          .map((file) => file.name)
          .join(", ")
      );
      onChange(ev.dataTransfer.files);
    }
  }

  function handleChange(ev: Event) {
    const files = (ev.currentTarget as HTMLInputElement).files;
    if (!files) {
      return;
    }
    setFilename(
      Array.from(files)
        .map((file) => file.name)
        .join(", ")
    );
    onChange(files);
  }

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        class={clsx(
          "flex cursor-pointer items-center justify-center rounded-md border-2 border-dotted bg-gray-50 text-center text-gray-700",
          className
        )}
      >
        {filename ? (
          <p>{filename}</p>
        ) : (
          <i>{prompt ?? "Click or drag a file here!"}</i>
        )}
      </div>
      <input
        ref={fileInputRef}
        class={"hidden"}
        type="file"
        accept={accept}
        onChange={handleChange}
        multiple={multiple}
      />
    </div>
  );
}
