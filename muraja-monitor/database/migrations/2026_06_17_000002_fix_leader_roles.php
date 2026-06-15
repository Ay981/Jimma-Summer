<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
  public function up(): void
  {
    // Any user who is the leader_id of a halqa was created via leaderSetup()
    // but got role='student' because role was excluded from $fillable.
    DB::statement("
      UPDATE users
      SET role = 'leader'
      WHERE id IN (SELECT leader_id FROM halqas WHERE leader_id IS NOT NULL)
        AND role = 'student'
    ");
  }

  public function down(): void
  {
    // Not reversible — we don't know which leaders were wrongly demoted.
  }
};
