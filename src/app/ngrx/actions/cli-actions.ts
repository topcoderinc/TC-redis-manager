/**
 * the cli actions
 */
export const ADD_COMMAND = 'ADD_COMMAND'; // when user enter command and press enter key
export const COMMAND_RUN_FINISHED = 'COMMAND_RUN_FINISHED'; // when command send to server and returned result
export const CLEAR_HISTORY = 'CLEAR_HISTORY'; // clear all cli history
export const TOGGLE_CLI = 'TOGGLE_CLI'; // toggle cli panel

export default {
  ADD_COMMAND,
  COMMAND_RUN_FINISHED,
  CLEAR_HISTORY,
  TOGGLE_CLI,
};
