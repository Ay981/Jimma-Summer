<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Part 5e — add seen_at to notifications table.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('notifications') && !Schema::hasColumn('notifications', 'seen_at')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->timestamp('seen_at')->nullable()->after('read_at');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('notifications', 'seen_at')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->dropColumn('seen_at');
            });
        }
    }
};
