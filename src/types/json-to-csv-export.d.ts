// Minimal typings for json-to-csv-export used in ExportButton.
declare module "json-to-csv-export" {
  export default function csvDownload(
    data: unknown[],
    filename?: string,
    delimiter?: string,
  ): void;
}
