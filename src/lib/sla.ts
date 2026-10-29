import { SLA_HOURS, type Priority } from "./constants";

export function computeDueDates(priority: Priority, from: Date = new Date()) {
  const { response, resolution } = SLA_HOURS[priority];
  return {
    responseDueDate: new Date(from.getTime() + response * 3_600_000),
    resolutionDueDate: new Date(from.getTime() + resolution * 3_600_000),
  };
}
