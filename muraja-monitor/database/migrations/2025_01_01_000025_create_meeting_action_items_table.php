<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meeting_action_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained('meeting_logs')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->text('description');
            $table->date('due_date')->nullable();
            $table->enum('status', ['open', 'resolved'])->default('open');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meeting_action_items');
    }
};
