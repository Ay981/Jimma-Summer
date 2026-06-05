<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Extra fields on contact_logs: snooze, outcome, escalation flag
        Schema::table('contact_logs', function (Blueprint $table) {
            $table->date('snooze_until')->nullable()->after('follow_up_required');
            $table->enum('outcome', ['pending', 'responded', 'no_response', 'resolved', 'escalated'])
                ->default('pending')->after('snooze_until');
        });

        // Escalation flag records
        Schema::create('leader_escalations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('leader_id')->constrained('users')->cascadeOnDelete();
            $table->text('note_summary');
            $table->timestamp('created_at')->useCurrent();
            $table->boolean('dismissed')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('contact_logs', function (Blueprint $table) {
            $table->dropColumn(['snooze_until', 'outcome']);
        });
        Schema::dropIfExists('leader_escalations');
    }
};
