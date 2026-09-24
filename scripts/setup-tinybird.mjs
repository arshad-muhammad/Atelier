import https from 'https';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const token = process.env.TINYBIRD_API_KEY || 'p.eyJ1IjogIjBhYzRkNjkxLTc1ZTAtNGRkZS05ZDZlLTI4NTc1YmM5OGRlYiIsICJpZCI6ICJiOTUwNDExZS1jMDFlLTQzM2YtYWExOC1hOWZiNTJjNDNiY2UiLCAiaG9zdCI6ICJnY3AtZXVyb3BlLXdlc3QyIn0.lZ31nTLqzeuxqxhURZdfgeRUckS8a1d0MXywisjXCPc';
const baseUrl = process.env.TINYBIRD_API_URL || 'https://api.europe-west2.gcp.tinybird.co';

async function runQuery(query) {
  const url = `${baseUrl}/v0/sql`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `q=${encodeURIComponent(query)}`
  });

  const text = await response.text();
  return { status: response.status, text };
}

async function main() {
  console.log('Testing ClickHouse / Tinybird connection...');

  const createEventsTable = `
    CREATE TABLE IF NOT EXISTS atelier_events (
      event_id String,
      event_name LowCardinality(String),
      timestamp DateTime,
      user_id Nullable(Int64),
      role LowCardinality(Nullable(String)),
      session_id Nullable(String),
      course_id Nullable(Int64),
      module_id Nullable(Int64),
      topic_id Nullable(Int64),
      assessment_id Nullable(Int64),
      live_session_id Nullable(Int64),
      source LowCardinality(Nullable(String)),
      metadata String
    ) ENGINE = MergeTree()
    PARTITION BY toYYYYMM(timestamp)
    ORDER BY (event_name, timestamp, user_id)
  `;

  const createAuditTable = `
    CREATE TABLE IF NOT EXISTS atelier_audit_events (
      event_id String,
      timestamp DateTime,
      admin_id Nullable(Int64),
      admin_email Nullable(String),
      action LowCardinality(String),
      entity LowCardinality(String),
      entity_id Nullable(String),
      old_value Nullable(String),
      new_value Nullable(String),
      status LowCardinality(String),
      metadata String
    ) ENGINE = MergeTree()
    PARTITION BY toYYYYMM(timestamp)
    ORDER BY (entity, timestamp)
  `;

  console.log('Creating atelier_events table...');
  const res1 = await runQuery(createEventsTable);
  console.log('atelier_events response:', res1.status, res1.text);

  console.log('Creating atelier_audit_events table...');
  const res2 = await runQuery(createAuditTable);
  console.log('atelier_audit_events response:', res2.status, res2.text);

  console.log('Verifying tables:');
  const resTables = await runQuery('SHOW TABLES');
  console.log('SHOW TABLES:', resTables.status, resTables.text);
}

main().catch(console.error);
