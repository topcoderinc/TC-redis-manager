/**
 * the cli command model
 */
export class CliModel {
  id: string;
  rawCommand: string;
  command: [any];
  time: Date;
  result: [any];
  status = 'new';
}
