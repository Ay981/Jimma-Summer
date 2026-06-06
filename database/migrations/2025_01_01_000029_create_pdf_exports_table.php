<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * FIX 7 — Add PDF export queue: store queued/ready exports so admin gets
 *          in-app notification when a large report finishes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pdf_exports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->string('report_type');          // program_report, submissions, etc.
            $table->enum('status', ['queued', 'processing', 'ready', 'failed'])->default('queued');
            $table->string('file_path')->nullable(); // storage path once ready
            $table->text('error_message')->nullable();
            $table->timestamp('ready_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pdf_exports');
    }
};
