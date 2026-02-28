// Keep local type shim aligned with package v3 object signature.
declare module "json-to-csv-export" {
  interface HeaderMapping {
    label: string;
    key: string;
  }

  interface CsvDownloadProps {
    data: unknown[];
    filename?: string;
    delimiter?: string;
    headers?: string[] | HeaderMapping[];
  }

  export default function csvDownload(props: CsvDownloadProps): void;
}
