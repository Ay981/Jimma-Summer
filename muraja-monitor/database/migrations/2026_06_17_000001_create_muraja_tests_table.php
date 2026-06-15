<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('muraja_tests', function (Blueprint $table) {
      $table->id();
      $table->foreignId('leader_id')->constrained('users')->cascadeOnDelete();
      $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
      $table->unsignedSmallInteger('from_page')->nullable();
      $table->unsignedSmallInteger('to_page')->nullable();
      $table->unsignedTinyInteger('from_juz')->nullable();
      $table->unsignedTinyInteger('to_juz')->nullable();
      $table->unsignedTinyInteger('score'); // 0–10
      $table->date('tested_at');
      $table->timestamps();

      $table->index(['student_id', 'tested_at']);
      $table->index('leader_id');
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('muraja_tests');
  }
};
