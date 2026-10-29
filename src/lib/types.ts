import type { Priority, Role, Status } from "./constants";

export type SessionUser = { id: string; name: string; email: string; role: Role };

export type SlaFields = {
  status: Status;
  responseDueDate: string;
  resolutionDueDate: string;
  firstResponseAt: string | null;
  slaBreached: boolean;
};

export type TicketRow = SlaFields & {
  id: string;
  ticketNumber: string;
  title: string;
  priority: Priority;
  category: string;
  createdBy: string;
  assignedAgent: string | null;
  createdAt: string;
};

export type TicketDetail = SlaFields & {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  priority: Priority;
  category: { id: string; name: string };
  createdBy: { id: string; name: string; email: string };
  assignedAgent: { id: string; name: string } | null;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export type MessageDTO = {
  id: string;
  author: { id: string; name: string; role: Role };
  body: string;
  attachments: string[];
  internal: boolean;
  createdAt: string;
};

export type ActivityDTO = { id: string; actor: string; action: string; details: string; createdAt: string };
export type Paginated<T> = { items: T[]; total: number; page: number; pages: number };
