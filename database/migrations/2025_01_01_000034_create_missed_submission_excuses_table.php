<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('missed_submission_excuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            // The scheduled day that was missed
            $table->date('missed_date');
            // Student-supplied reason
            $table->string('reason', 500);
            // Proposed makeup date (must be within same calendar week as missed_date)
            $table->date('makeup_date');
            // Whether the makeup submission was fulfilled
            $table->boolean('fulfilled')->default(false);
            $table->timestamps();

            $table->unique(['student_id', 'missed_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('missed_submission_excuses');
    }
};
