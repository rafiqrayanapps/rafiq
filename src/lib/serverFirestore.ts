import firebaseConfig from '../../firebase-applet-config.json';

const projectId = firebaseConfig.projectId || 'rafiq-87f88';
const apiKey = firebaseConfig.apiKey || '';
const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;

function parseFirestoreValue(val: any): any {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('mapValue' in val) {
    const fields = val.mapValue?.fields || {};
    const obj: any = {};
    for (const [k, v] of Object.entries(fields)) {
      obj[k] = parseFirestoreValue(v);
    }
    return obj;
  }
  if ('arrayValue' in val) {
    const values = val.arrayValue?.values || [];
    return values.map(parseFirestoreValue);
  }
  return null;
}

export function parseFirestoreDoc(doc: any): any {
  if (!doc) return null;
  const nameParts = (doc.name || '').split('/');
  const id = nameParts[nameParts.length - 1] || '';
  const fields = doc.fields || {};
  const data: any = { id };
  for (const [k, v] of Object.entries(fields)) {
    data[k] = parseFirestoreValue(v);
  }
  return data;
}

export function encodeFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(encodeFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: any = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = encodeFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export async function getFirestoreDoc(path: string): Promise<any | null> {
  try {
    const url = `${BASE_URL}/${path}?key=${apiKey}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 404) return null;
      console.warn(`getFirestoreDoc ${path} returned status ${res.status}`);
      return null;
    }
    const json = await res.json();
    return parseFirestoreDoc(json);
  } catch (err) {
    console.error(`getFirestoreDoc error for ${path}:`, err);
    return null;
  }
}

export async function getFirestoreCollection(collectionPath: string, limit = 50): Promise<any[]> {
  try {
    const url = `${BASE_URL}/${collectionPath}?key=${apiKey}&pageSize=${limit}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.warn(`getFirestoreCollection ${collectionPath} returned status ${res.status}`);
      return [];
    }
    const json = await res.json();
    const docs = json.documents || [];
    return docs.map(parseFirestoreDoc);
  } catch (err) {
    console.error(`getFirestoreCollection error for ${collectionPath}:`, err);
    return [];
  }
}

export async function queryFirestoreCollection(
  collectionId: string,
  field: string,
  op: 'EQUAL' | 'GREATER_THAN' | 'LESS_THAN',
  value: any,
  limit = 10
): Promise<any[]> {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery?key=${apiKey}`;
    const body = {
      structuredQuery: {
        from: [{ collectionId }],
        where: {
          fieldFilter: {
            field: { fieldPath: field },
            op,
            value: encodeFirestoreValue(value),
          },
        },
        limit,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn(`queryFirestoreCollection ${collectionId} returned status ${res.status}`);
      return [];
    }

    const json = await res.json();
    if (!Array.isArray(json)) return [];

    const results: any[] = [];
    for (const item of json) {
      if (item.document) {
        results.push(parseFirestoreDoc(item.document));
      }
    }
    return results;
  } catch (err) {
    console.error(`queryFirestoreCollection error for ${collectionId}:`, err);
    return [];
  }
}

export async function updateFirestoreFields(path: string, fieldsObj: Record<string, any>): Promise<boolean> {
  try {
    const fieldPaths = Object.keys(fieldsObj).map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&');
    const url = `${BASE_URL}/${path}?key=${apiKey}&${fieldPaths}`;
    
    const fieldsMap: any = {};
    for (const [k, v] of Object.entries(fieldsObj)) {
      fieldsMap[k] = encodeFirestoreValue(v);
    }

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: fieldsMap }),
    });

    return res.ok;
  } catch (err) {
    console.error(`updateFirestoreFields error for ${path}:`, err);
    return false;
  }
}
