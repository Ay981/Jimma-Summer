<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Part 2 — Add profile_completed to users.
 * Also adds memo_level column for the profile completion form.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('profile_completed')->default(false)->after('must_change_password');
            $table->string('memo_level')->nullable()->after('current_juz');
            $table->text('health_notes')->nullable()->after('memo_level');
            $table->boolean('is_solo')->default(false)->after('is_monitored');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['profile_completed', 'memo_level', 'health_notes', 'is_solo']);
        });
    }
};
