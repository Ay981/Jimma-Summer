<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Support\Facades\Config;

/**
 * Base test case for feature tests that exercise controllers/services relying on
 * PostgreSQL-only SQL (e.g. `DATE_TRUNC`, `::text`/`::date` casts). The default
 * PHPUnit suite runs on in-memory sqlite, which cannot parse that SQL.
 *
 * We keep the DB host/credentials from the environment (.env → Postgres on the
 * dev machine) but force the connection to `pgsql` and point it at a dedicated
 * `*_test` database so the suite never touches development data. Combined with
 * RefreshDatabase in the concrete test, each test runs migrations in a fresh
 * transaction against that throwaway database.
 */
abstract class PostgresTestCase extends TestCase
{
    /**
     * RefreshDatabase records whether it has migrated in a global static. Because
     * this class swaps the default connection to Postgres, we reset that flag
     * around the class so (a) Postgres migrates fresh even if a prior sqlite test
     * set the flag, and (b) later sqlite tests re-migrate their own :memory: DB.
     */
    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();
        RefreshDatabaseState::$migrated = false;
    }

    public static function tearDownAfterClass(): void
    {
        RefreshDatabaseState::$migrated = false;
        parent::tearDownAfterClass();
    }

    protected function refreshApplication()
    {
        parent::refreshApplication();

        $baseDatabase = env('DB_DATABASE', 'muraja_monitor');
        $testDatabase = str_ends_with($baseDatabase, '_test')
            ? $baseDatabase
            : $baseDatabase.'_test';

        Config::set('database.default', 'pgsql');
        Config::set('database.connections.pgsql.database', $testDatabase);
        // Local Postgres does not require SSL; the config default is `require`.
        Config::set('database.connections.pgsql.sslmode', env('DB_SSLMODE', 'prefer'));
    }
}
