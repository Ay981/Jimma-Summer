<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // seen_at on notifications
        Schema::table('notifications', function (Blueprint $table) {
            $table->timestamp('seen_at')->nullable()->after('read_at');
        });

        // Expand meeting_logs with new fields
        Schema::table('meeting_logs', function (Blueprint $table) {
            $table->time('meeting_time')->nullable()->after('meeting_date');
            $table->json('agenda_items')->nullable()->after('notes');
            $table->json('attendance')->nullable()->after('agenda_items');
            $table->text('highlights')->nullable()->after('attendance');
            $table->text('concerns')->nullable()->after('highlights');
            $table->enum('state', ['draft', 'final'])->default('draft')->after('concerns');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn('seen_at');
        });
        Schema::table('meeting_logs', function (Blueprint $table) {
            $table->dropColumn(['meeting_time', 'agenda_items', 'attendance', 'highlights', 'concerns', 'state']);
        });
    }
};
