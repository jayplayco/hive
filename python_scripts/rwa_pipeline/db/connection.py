"""PostgreSQL connection pool and schema bootstrap."""

import logging
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

import psycopg2
import psycopg2.extras
from psycopg2 import pool

from rwa_pipeline.config import config

logger = logging.getLogger(__name__)

_pool: pool.ThreadedConnectionPool | None = None
_SCHEMA_FILE = Path(__file__).parent / "schema.sql"


def init_pool(minconn: int = 1, maxconn: int = 5) -> None:
    """Initialise the connection pool. Call once at startup."""
    global _pool
    _pool = pool.ThreadedConnectionPool(
        minconn=minconn,
        maxconn=maxconn,
        dsn=config.db_dsn,
        cursor_factory=psycopg2.extras.RealDictCursor,
    )
    logger.info("PostgreSQL connection pool initialised (min=%d, max=%d)", minconn, maxconn)


def bootstrap_schema() -> None:
    """Create tables if they don't exist (idempotent)."""
    ddl = _SCHEMA_FILE.read_text()
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(ddl)
        conn.commit()
    logger.info("Schema bootstrap complete.")


@contextmanager
def get_conn() -> Generator:
    """Yield a connection from the pool, returning it on exit."""
    if _pool is None:
        raise RuntimeError("Call init_pool() before get_conn()")
    conn = _pool.getconn()
    try:
        yield conn
    except Exception:
        conn.rollback()
        raise
    finally:
        _pool.putconn(conn)


def insert_many(table: str, rows: list[dict]) -> int:
    """
    Bulk-insert a list of dicts into *table*.
    Column names are derived from the keys of the first row.
    Returns the number of rows inserted.
    """
    if not rows:
        return 0

    columns = list(rows[0].keys())
    col_str = ", ".join(columns)
    val_str = ", ".join(f"%({c})s" for c in columns)
    sql = f"INSERT INTO {table} ({col_str}) VALUES ({val_str})"

    with get_conn() as conn:
        with conn.cursor() as cur:
            psycopg2.extras.execute_batch(cur, sql, rows)
        conn.commit()

    logger.debug("Inserted %d rows into %s", len(rows), table)
    return len(rows)


def upsert_pipeline_run(run_id: int | None, **kwargs) -> int:
    """Create or update a pipeline_runs record. Returns the run id."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            if run_id is None:
                cur.execute(
                    "INSERT INTO pipeline_runs (status) VALUES ('running') RETURNING id"
                )
                run_id = cur.fetchone()["id"]
            else:
                sets = ", ".join(f"{k} = %({k})s" for k in kwargs)
                cur.execute(
                    f"UPDATE pipeline_runs SET {sets} WHERE id = %(run_id)s",
                    {"run_id": run_id, **kwargs},
                )
        conn.commit()
    return run_id
