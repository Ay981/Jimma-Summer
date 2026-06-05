<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leader_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('halqa_id')->constrained('halqas')->cascadeOnDelete();
            $table->string('code', 8)->unique();
            $table->boolean('is_active')->default(true);
            $table->foreignId('used_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leader_codes');
    }
};
