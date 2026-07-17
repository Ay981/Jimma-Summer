<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rank_snapshots', function (Blueprint $table) {
            $table->id();
            $table->string('subject_type', 16);              // 'student' | 'leader'
            $table->foreignId('subject_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedSmallInteger('rank');
            $table->decimal('rank_score', 8, 2);             // student rank_score OR leader score
            $table->date('captured_on');
            $table->timestamps();

            $table->unique(['subject_type', 'subject_id', 'captured_on']);
            $table->index(['subject_type', 'captured_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rank_snapshots');
    }
};
