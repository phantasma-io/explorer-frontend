export const transactionStateFilterValues = ["all", "halt", "break", "fault"] as const;

export type TransactionStateFilter = (typeof transactionStateFilterValues)[number];

export interface TransactionStateFilterOption {
  value: TransactionStateFilter;
  label: string;
}

export const transactionStateFilterOptions: readonly TransactionStateFilterOption[] = [
  { value: "all", label: "All" },
  { value: "halt", label: "Halt" },
  { value: "break", label: "Break" },
  { value: "fault", label: "Fault" },
];
