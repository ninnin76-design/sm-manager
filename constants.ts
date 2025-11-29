import { Person, TEAMS } from './types';

export const TEAM_MEMBERS: Person[] = [
  { id: 'h_1', name: '김하나', group: TEAMS.HWASEONG },
  { id: 'h_2', name: '김둘', group: TEAMS.HWASEONG },
  { id: 'h_3', name: '김셋', group: TEAMS.HWASEONG },
  { id: 'o_1', name: '박하나', group: TEAMS.OSAN },
  { id: 'o_2', name: '박둘', group: TEAMS.OSAN },
  { id: 'o_3', name: '박셋', group: TEAMS.OSAN },
];

export const INITIAL_RECORD: import('./types').TaskRecord = {
  completed: false,
  remarks: ''
};