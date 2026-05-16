/** In-memory document registry (replace with DB + object storage in production). */

const documents = [];

export function saveDocument(record) {
  const doc = {
    id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    uploaded_at: new Date().toISOString(),
    ...record,
  };
  documents.push(doc);
  return doc;
}

export function listDocumentsByStartup(startup_id, { type } = {}) {
  return documents.filter((d) => {
    if (d.startup_id !== startup_id) return false;
    if (type && d.type !== type) return false;
    return true;
  });
}

export function listDocumentsByPair(startup_id, mentor_id) {
  return documents.filter(
    (d) => d.startup_id === startup_id && d.mentor_id === mentor_id
  );
}
