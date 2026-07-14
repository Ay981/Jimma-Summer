<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\CertificateCode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CertificateCodeTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_builds_certificate_code_from_student_id(): void
    {
        $student = User::create([
            'name' => 'Test Student',
            'student_id' => 'JUMU-2026-001',
            'password' => 'password',
            'role' => 'student',
        ]);

        $this->assertSame('IMS-2026-0001', CertificateCode::forStudent($student, '2026-08-01'));
    }

    public function test_it_finds_student_from_padded_certificate_code(): void
    {
        $student = User::create([
            'name' => 'Test Student',
            'student_id' => 'JUMU-2026-001',
            'password' => 'password',
            'role' => 'student',
        ]);

        $this->assertTrue($student->is(CertificateCode::studentForCode('ims-2026-0001')));
    }
}
