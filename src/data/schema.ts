export const schema = `
CREATE TABLE projects (
  id TEXT PRIMARY KEY, name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 200),
  color TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0 CHECK(archived IN (0,1)), createdAt TEXT NOT NULL
);
CREATE TABLE captures (
  id TEXT PRIMARY KEY, text TEXT NOT NULL CHECK(length(trim(text)) BETWEEN 1 AND 30000),
  createdAt TEXT NOT NULL, convertedAt TEXT
);
CREATE TABLE tasks (
  id TEXT PRIMARY KEY, title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 200), details TEXT NOT NULL DEFAULT '',
  projectId TEXT REFERENCES projects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','done')),
  dueDate TEXT, startAt TEXT, duration INTEGER NOT NULL DEFAULT 30 CHECK(duration BETWEEN 5 AND 720),
  remind INTEGER NOT NULL DEFAULT 0 CHECK(remind IN (0,1)), createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  sourceCaptureId TEXT UNIQUE REFERENCES captures(id)
);
CREATE TABLE notes (
  id TEXT PRIMARY KEY, title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 200), body TEXT NOT NULL DEFAULT '',
  projectId TEXT REFERENCES projects(id) ON DELETE SET NULL, updatedAt TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1, sourceCaptureId TEXT UNIQUE REFERENCES captures(id)
);
CREATE TABLE events (
  id TEXT PRIMARY KEY, title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 200),
  startAt TEXT NOT NULL, duration INTEGER NOT NULL CHECK(duration BETWEEN 5 AND 720), revision INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX tasks_project ON tasks(projectId);
CREATE INDEX tasks_start ON tasks(startAt);
CREATE INDEX notes_project ON notes(projectId);
PRAGMA user_version = 1;
`;
