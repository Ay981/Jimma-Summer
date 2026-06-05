<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('contacted_by')->constrained('users')->cascadeOnDelete();
            $table->enum('method', ['call', 'message', 'in_person']);
            $table->text('note');
            $table->timestamp('contacted_at')->useCurrent();
            $table->boolean('follow_up_required')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_logs');
    }
};
