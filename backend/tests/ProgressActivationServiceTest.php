<?php
declare(strict_types=1);

namespace Tests;

use App\Config\Database;
use App\Services\ProgressActivationService as Progress;
use PDO;
use PHPUnit\Framework\TestCase;

/** Uses only a freshly created isolated schema, never the application's database. */
final class ProgressActivationServiceTest extends TestCase
{
    private static ?PDO $admin = null;
    private static PDO $db;
    private static string $schema;

    public static function setUpBeforeClass(): void
    {
        $dsn = getenv('TRACKING_TEST_MYSQL_DSN');
        if (!$dsn) self::markTestSkipped('Set TRACKING_TEST_MYSQL_DSN to an isolated local MySQL server (no dbname).');
        if (str_contains($dsn, 'dbname=')) throw new \RuntimeException('Test DSN must not name an application database');
        self::$admin = new PDO($dsn, getenv('TRACKING_TEST_MYSQL_USER') ?: 'root', getenv('TRACKING_TEST_MYSQL_PASSWORD') ?: '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        self::$schema = 'yf_tracking_test_' . bin2hex(random_bytes(8));
        self::$admin->exec('CREATE DATABASE `' . self::$schema . '`');
        self::$db = new PDO($dsn . ';dbname=' . self::$schema, getenv('TRACKING_TEST_MYSQL_USER') ?: 'root', getenv('TRACKING_TEST_MYSQL_PASSWORD') ?: '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]);
        self::$db->exec('CREATE TABLE users (id INT PRIMARY KEY) ENGINE=InnoDB');
        self::$db->exec('CREATE TABLE projects (id INT PRIMARY KEY, user_id INT, is_demo INT DEFAULT 0, current_row DECIMAL(10,1) DEFAULT 0) ENGINE=InnoDB');
        self::$db->exec('CREATE TABLE project_sections (id INT PRIMARY KEY, project_id INT, current_row DECIMAL(10,1) DEFAULT 0) ENGINE=InnoDB');
        self::$db->exec('CREATE TABLE ai_pattern_imports (id INT PRIMARY KEY, project_id INT, source_type VARCHAR(20)) ENGINE=InnoDB');
        self::$db->exec('CREATE TABLE analytics_events (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, project_id INT, event_name VARCHAR(100), event_data JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_user_event (user_id, event_name)) ENGINE=InnoDB');
    }

    protected function setUp(): void
    {
        foreach (['analytics_events', 'ai_pattern_imports', 'project_sections', 'projects', 'users'] as $table) self::$db->exec('DELETE FROM ' . $table);
        self::$db->exec('INSERT INTO users VALUES (1), (2)');
        self::$db->exec('INSERT INTO projects (id, user_id, is_demo) VALUES (10, 1, 0), (11, 1, 0), (12, 1, 1), (20, 2, 0)');
        self::$db->exec('INSERT INTO project_sections (id, project_id) VALUES (100, 10)');
        (new \ReflectionProperty(Database::class, 'connection'))->setValue(Database::getInstance(), self::$db);
    }

    public static function tearDownAfterClass(): void
    {
        if (self::$admin && isset(self::$schema) && preg_match('/^yf_tracking_test_[a-f0-9]{16}$/', self::$schema)) {
            self::$admin->exec('DROP DATABASE `' . self::$schema . '`');
            (new \ReflectionProperty(Database::class, 'connection'))->setValue(Database::getInstance(), null);
        }
    }

    public function testRowsCentimetresAndDirectEntryAfterPersistence(): void
    {
        foreach ([1, 0.5, 17] as $value) {
            self::$db->exec('DELETE FROM analytics_events');
            self::$db->exec('UPDATE project_sections SET current_row = 0 WHERE id = 100');
            $before = Progress::counterValue(10, 100);
            self::$db->exec('UPDATE project_sections SET current_row = ' . $value . ' WHERE id = 100');
            self::assertTrue(Progress::recordCounterUpdate(1, 10, $before, Progress::counterValue(10, 100), true));
            self::assertSame(1, (int)self::$db->query('SELECT COUNT(*) FROM analytics_events')->fetchColumn());
        }
    }

    public function testOfflineReplayActivatesOnlyOnceWhenPersisted(): void
    {
        self::assertSame(0, (int)self::$db->query('SELECT COUNT(*) FROM analytics_events')->fetchColumn());
        // The offline queue replays POST /rows; the backend sees the same persisted increase.
        foreach ([1, 2, 3] as $row) {
            $before = Progress::counterValue(10);
            self::$db->exec('UPDATE projects SET current_row = ' . $row . ' WHERE id = 10');
            self::assertSame($row === 1, Progress::recordCounterUpdate(1, 10, $before, Progress::counterValue(10), true));
        }
        self::assertSame(1, (int)self::$db->query('SELECT COUNT(*) FROM analytics_events')->fetchColumn());
    }

    public function testDemoForeignProjectInitialValueAndNonProgressAreExcluded(): void
    {
        self::assertFalse(Progress::recordCounterUpdate(1, 12, 0, 1, true));
        self::assertFalse(Progress::recordCounterUpdate(1, 20, 0, 1, true));
        self::assertFalse(Progress::recordCounterUpdate(1, 10, 0, 20, false));
        self::assertFalse(Progress::recordCounterUpdate(1, 10, 5, 4, true));
        self::assertFalse(Progress::recordCounterUpdate(1, 10, 5, 5, true));
        self::assertFalse(Progress::recordCounterUpdate(1, 10, null, null, true));
        self::assertSame(0, (int)self::$db->query('SELECT COUNT(*) FROM analytics_events')->fetchColumn());
    }

    public function testHistoricalActivationAndSecondProjectDoNotDuplicate(): void
    {
        self::$db->exec("INSERT INTO analytics_events (user_id, project_id, event_name) VALUES (1, 10, 'activation_reached')");
        self::assertFalse(Progress::recordCounterUpdate(1, 11, 0, 1, true));
        self::assertSame(1, (int)self::$db->query('SELECT COUNT(*) FROM analytics_events')->fetchColumn());
    }

    public function testSmartOriginIsPreserved(): void
    {
        self::$db->exec("INSERT INTO ai_pattern_imports VALUES (42, 10, 'pdf')");
        self::assertTrue(Progress::recordCounterUpdate(1, 10, 0, 1, true));
        $data = json_decode(self::$db->query('SELECT event_data FROM analytics_events')->fetchColumn(), true);
        self::assertSame('smart', $data['method']);
        self::assertSame('pdf', $data['source']);
        self::assertSame('backend_progression', $data['recorded_by']);
    }

    public function testTwoSimultaneousProgressionsOnDifferentProjectsHaveOneActivation(): void
    {
        $processes = [];
        self::$db->beginTransaction();
        self::$db->query('SELECT id FROM users WHERE id = 1 FOR UPDATE')->fetchColumn();
        try {
            foreach ([10, 11] as $project) {
                $process = proc_open([PHP_BINARY, '-d', 'xdebug.mode=off', __DIR__ . '/fixtures/activation-worker.php', self::$schema, (string)$project], [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
                self::assertIsResource($process);
                fclose($pipes[0]);
                stream_set_timeout($pipes[1], 10);
                self::assertSame("ready\n", fgets($pipes[1]));
                $processes[] = [$process, $pipes];
            }
        } finally {
            self::$db->commit();
        }
        $results = [];
        foreach ($processes as [$process, $pipes]) {
            $results[] = trim(stream_get_contents($pipes[1]));
            fclose($pipes[1]);
            stream_get_contents($pipes[2]); fclose($pipes[2]);
            self::assertSame(0, proc_close($process));
        }
        sort($results);
        self::assertSame(['existing', 'inserted'], $results);
        self::assertSame(1, (int)self::$db->query('SELECT COUNT(*) FROM analytics_events')->fetchColumn());
    }
}
