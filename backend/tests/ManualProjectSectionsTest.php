<?php

declare(strict_types=1);

namespace Tests;

use App\Models\Project;
use PDO;
use PHPUnit\Framework\TestCase;

final class ManualProjectSectionsTest extends TestCase
{
    private function model(PDO $db): Project
    {
        $model = (new \ReflectionClass(Project::class))->newInstanceWithoutConstructor();
        (new \ReflectionProperty($model, 'db'))->setValue($model, $db);
        return $model;
    }

    private function database(): PDO
    {
        $db = new PDO('sqlite::memory:');
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $db->exec('CREATE TABLE projects (id INTEGER PRIMARY KEY, current_section_id INTEGER NULL)');
        $db->exec('INSERT INTO projects (id, current_section_id) VALUES (1, NULL)');
        $db->exec('CREATE TABLE project_sections (
            id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER, name TEXT,
            description TEXT, notes TEXT, display_order INTEGER, total_rows DECIMAL(10,1),
            current_row DECIMAL(10,1), counter_unit TEXT, progression_type TEXT,
            is_completed INTEGER DEFAULT 0, time_spent INTEGER DEFAULT 0
        )');
        return $db;
    }

    public function testManualSectionsPersistRoundsCmAndAnUnboundedTarget(): void
    {
        $db = $this->database();
        $model = $this->model($db);
        $rounds = $model->createSection(1, ['name' => 'Crocheter', 'total_rows' => 8, 'counter_unit' => 'rounds']);
        $cm = $model->createSection(1, ['name' => 'Mesurer', 'total_rows' => 12, 'counter_unit' => 'cm']);
        $free = $model->createSection(1, ['name' => 'Finitions', 'total_rows' => null, 'counter_unit' => 'rows']);

        self::assertSame('rounds', $model->getSectionById($rounds)['counter_unit']);
        self::assertEquals(8, $model->getSectionById($rounds)['total_rows']);
        self::assertSame('cm', $model->getSectionById($cm)['counter_unit']);
        self::assertEquals(12, $model->getSectionById($cm)['total_rows']);
        self::assertNull($model->getSectionById($free)['total_rows']);
        self::assertSame('simple', $model->getSectionById($free)['progression_type']);
        self::assertEquals($rounds, $db->query('SELECT current_section_id FROM projects WHERE id = 1')->fetchColumn());
    }

    public function testEditingAndReorderingKeepTheSelectedUnit(): void
    {
        $model = $this->model($this->database());
        $id = $model->createSection(1, ['name' => 'Tours', 'total_rows' => 8, 'counter_unit' => 'rounds']);
        self::assertTrue($model->updateSection($id, ['name' => 'Tours du corps', 'display_order' => 3]));
        $stored = $model->getSectionById($id);
        self::assertSame('rounds', $stored['counter_unit']);
        self::assertSame('Tours du corps', $stored['name']);
        self::assertSame(3, (int)$stored['display_order']);
    }
}
