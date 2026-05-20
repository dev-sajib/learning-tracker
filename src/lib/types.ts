export type ID = string;

export interface Subtopic {
  id: ID;
  topicId: ID;
  name: string;
  createdAt: string;
}

export interface Topic {
  id: ID;
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
}

export interface Entry {
  id: ID;
  topicId: ID;
  subtopicId?: ID;
  date: string;     // YYYY-MM-DD local
  summary: string;  // "what I learned"
  createdAt: string;
}

export interface TrackerState {
  topics: Topic[];
  subtopics: Subtopic[];
  entries: Entry[];
  version: number;
}
