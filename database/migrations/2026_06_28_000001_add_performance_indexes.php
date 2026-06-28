<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Users table - heavily filtered by role and halqa
        Schema::table('users', function (Blueprint $table) {
            $table->index('role');
            $table->index('is_active');
            $table->index(['halqa_id', 'role'], 'users_halqa_role_idx');
        });

        // Pair submissions - date range queries and filtering
        Schema::table('pair_submissions', function (Blueprint $table) {
            $table->index('juz');
            $table->index('is_flagged');
            $table->index(['subject_student_id', 'juz'], 'pair_submissions_student_juz_idx');
            $table->index('submission_date');
        });

        // Pairs table - status filtering
        Schema::table('pairs', function (Blueprint $table) {
            $table->index('status');
        });

        // Notifications - unread queries with composite index
        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['notifiable_id', 'notifiable_type', 'read_at'], 'notifications_unread_idx');
        });

        // Watchlist - filtering by resolved status
        Schema::table('watchlist', function (Blueprint $table) {
            $table->index('resolved_at');
        });

        // Contact logs - ordering and date filtering
        Schema::table('contact_logs', function (Blueprint $table) {
            $table->index('contacted_at');
        });

        // Excuses - makeup date queries and fulfillment status
        Schema::table('missed_submission_excuses', function (Blueprint $table) {
            $table->index('makeup_date');
            $table->index('fulfilled');
        });

        // Meeting logs - date ordering
        Schema::table('meeting_logs', function (Blueprint $table) {
            $table->index('meeting_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropIndex(['is_active']);
            $table->dropIndex('users_halqa_role_idx');
        });

        Schema::table('pair_submissions', function (Blueprint $table) {
            $table->dropIndex(['juz']);
            $table->dropIndex(['is_flagged']);
            $table->dropIndex('pair_submissions_student_juz_idx');
            $table->dropIndex(['submission_date']);
        });

        Schema::table('pairs', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('notifications_unread_idx');
        });

        Schema::table('watchlist', function (Blueprint $table) {
            $table->dropIndex(['resolved_at']);
        });

        Schema::table('contact_logs', function (Blueprint $table) {
            $table->dropIndex(['contacted_at']);
        });

        Schema::table('missed_submission_excuses', function (Blueprint $table) {
            $table->dropIndex(['makeup_date']);
            $table->dropIndex(['fulfilled']);
        });

        Schema::table('meeting_logs', function (Blueprint $table) {
            $table->dropIndex(['meeting_date']);
        });
    }
};
