import { ListResults } from './list';

export interface Instruction {
  instruction?: string;
}

export interface IntructionParams {
  script_raw?: string;
}

export interface InstructionResults extends ListResults {
  instructions?: Instruction[];
}
