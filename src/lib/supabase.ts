import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const restUrl = supabaseUrl ? `${supabaseUrl}/rest/v1` : '';

type Primitive = string | number | boolean | null;

export type FilterOperator = 'eq' | 'in' | 'is' | 'gte' | 'lte';

export type Filter = {
  column: string;
  op?: FilterOperator;
  value: Primitive | Primitive[];
};

function encodeValue(value: Primitive) {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return String(value);
  return String(value).split(',').join('\\,');
}

function buildUrl(table: string, options?: { select?: string; filters?: Filter[]; order?: string; limit?: number }) {
  const url = new URL(`${restUrl}/${table}`);
  const params = url.searchParams;

  if (options?.select) params.set('select', options.select);
  if (options?.order) params.set('order', options.order);
  if (typeof options?.limit === 'number') params.set('limit', String(options.limit));

  for (const filter of options?.filters || []) {
    const op = filter.op || 'eq';
    if (op === 'in' && Array.isArray(filter.value)) {
      params.set(filter.column, `in.(${filter.value.map((item) => encodeValue(item as Primitive)).join(',')})`);
    } else if (op === 'is') {
      params.set(filter.column, `is.${encodeValue(filter.value as Primitive)}`);
    } else {
      params.set(filter.column, `${op}.${encodeValue(filter.value as Primitive)}`);
    }
  }

  return url.toString();
}

async function baseHeaders(extra?: HeadersInit): Promise<HeadersInit> {
  let authHeader = `Bearer ${supabaseAnonKey}`;
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      authHeader = `Bearer ${session.access_token}`;
    }
  }

  return {
    apikey: supabaseAnonKey,
    Authorization: authHeader,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  if (!isSupabaseConfigured) {
    throw new Error('Falta configurar Supabase. Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env.');
  }

  const response = await fetch(input, init);

  if (!response.ok) {
    let message = `Error ${response.status}`;
    try {
      const body = await response.json();
      message = body.message || body.error || body.hint || message;
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return [] as T;
  }

  return response.json() as Promise<T>;
}

export async function selectRows<T>(table: string, options?: { select?: string; filters?: Filter[]; order?: string; limit?: number }) {
  const headers = await baseHeaders();
  return request<T[]>(buildUrl(table, options), {
    method: 'GET',
    headers,
  });
}

export async function insertRows<T>(table: string, payload: Record<string, unknown> | Array<Record<string, unknown>>, options?: { select?: string; onConflict?: string; upsert?: boolean }) {
  const headerParams = await baseHeaders({
    Prefer: `${options?.upsert ? 'resolution=merge-duplicates,' : ''}return=representation`,
  });

  return request<T[]>(buildUrl(table, { select: options?.select || '*' }) + (options?.onConflict ? `&on_conflict=${encodeURIComponent(options.onConflict)}` : ''), {
    method: 'POST',
    headers: headerParams,
    body: JSON.stringify(payload),
  });
}

export async function updateRows<T>(table: string, payload: Record<string, unknown>, filters: Filter[], options?: { select?: string }) {
  const headers = await baseHeaders({ Prefer: 'return=representation' });
  return request<T[]>(buildUrl(table, { select: options?.select || '*', filters }), {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });
}

export async function deleteRows<T>(table: string, filters: Filter[], options?: { select?: string }) {
  const headers = await baseHeaders({ Prefer: 'return=representation' });
  return request<T[]>(buildUrl(table, { select: options?.select || '*', filters }), {
    method: 'DELETE',
    headers,
  });
}
