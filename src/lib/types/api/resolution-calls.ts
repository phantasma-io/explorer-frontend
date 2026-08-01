import { ListResults } from './list';
import { SpecialResolutionCall } from './eventTypes';

/** A resolution call as the dedicated endpoint serves it: with its decoded arguments. */
export type ResolutionCall = SpecialResolutionCall;

export interface ResolutionCallResults extends ListResults {
  calls?: ResolutionCall[];
}
