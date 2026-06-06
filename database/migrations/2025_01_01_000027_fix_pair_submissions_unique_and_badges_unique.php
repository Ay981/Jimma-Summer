<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * FIX 1  – pair_submissions: unique on (subject_student_id, submission_date)
 *          regardless of submitted_by. The existing constraint already covers
 *          this, but make it explicit with a named check so the migration
 *          is idempotent.
 *
 * FIX 4  – badges: unique on (user_id, badge_type) to prevent double awards.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── FIX 1: pair_submissions unique ────────────────────────────────────
        // Drop the old named constraint if it exists, then re-add with the same
        // columns — (subject_student_id, submission_date) — which is what we want.
        Schema::table('pair_submissions', function (Blueprint $table) {
            // Drop old constraint if present (Laravel uses index name from migration)
            try {
                $table->dropUnique('one_submission_per_student_per_day');
            } catch (\Throwable) {
                // Already dropped or named differently — continue
            }

            // pair_id is now nullable for solo students
            $table->foreignId('pair_id')->nullable()->change();

            // Enforce unique at (subject, date) — submitted_by is irrelevant
            $table->unique(['subject_student_id', 'submission_date'], 'one_submission_per_student_per_day');
        });

        // ── FIX 4: badges unique ──────────────────────────────────────────────
        // Deduplicate any existing double awards first, then add constraint.
        $dupes = DB::select("
            SELECT user_id, badge_type, MIN(id) AS keep_id
            FROM badges
            GROUP BY user_id, badge_type
            HAVING COUNT(*) > 1
        ");
        foreach ($dupes as $d) {
            DB::table('badges')
                ->where('user_id', $d->user_id)
                ->where('badge_type', $d->badge_type)
                ->where('id', '!=', $d->keep_id)
                ->delete();
        }

        Schema::table('badges', function (Blueprint $table) {
            // Add if not already present
            try {
                $table->unique(['user_id', 'badge_type'], 'badges_user_badge_unique');
            } catch (\Throwable) {
                // Constraint already exists
            }
        });
    }

    public function down(): void
    {
        Schema::table('pair_submissions', function (Blueprint $table) {
            $table->dropUnique('one_submission_per_student_per_day');
            $table->foreignId('pair_id')->nullable(false)->change();
            $table->unique(['subject_student_id', 'submission_date'], 'one_submission_per_student_per_day');
        });

        Schema::table('badges', function (Blueprint $table) {
            $table->dropUnique('badges_user_badge_unique');
        });
    }
};
