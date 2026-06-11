<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pair_change_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requested_by')->constrained('users');       // the student
            $table->foreignId('current_pair_id')->constrained('pairs')->cascadeOnDelete();
            $table->foreignId('current_partner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('requested_partner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('reason');
            $table->enum('type', ['same_halqa', 'cross_halqa', 'unspecified'])->default('unspecified');
            $table->enum('status', ['escalated_to_admin', 'approved', 'rejected'])->default('escalated_to_admin');
            $table->timestamp('requested_at');
            $table->foreignId('leader_id')->constrained('users');           // who filed it
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pair_change_requests');
    }
};
