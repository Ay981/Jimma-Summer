<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pair_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pair_id')->constrained('pairs')->cascadeOnDelete();
            $table->foreignId('submitted_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('subject_student_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('juz');
            $table->unsignedSmallInteger('page_from');
            $table->unsignedSmallInteger('page_to');
            $table->unsignedSmallInteger('minutes_spent');
            $table->date('submission_date');
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamp('edited_at')->nullable();
            $table->boolean('is_edited')->default(false);
            $table->timestamps();

            $table->unique(['subject_student_id', 'submission_date'], 'one_submission_per_student_per_day');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pair_submissions');
    }
};
