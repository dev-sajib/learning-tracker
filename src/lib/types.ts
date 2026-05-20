export type ID = string;

export interface Subtopic {
  id: ID;
  topicId: ID;
  name: string;
  createdAt: string; // ISO
}

export interface Topic {
  id: ID;
  name: string;
  color: string; // hex/css
  icon?: string;
  createdAt: string;
}

export interface Entry {
  id: ID;
  topicId: ID;
  subtopicId?: ID;
  date: string; // YYYY-MM-DD (local)
  minutes: number;
  notes?: string;
  createdAt: string;
}

export interface TrackerState {
  topics: Topic[];
  subtopics: Subtopic[];
  entries: Entry[];
  version: number;
}
