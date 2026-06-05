<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('program_snapshots', function (Blueprint $table) {
            $table->id();
            $table->string('program_name');
            $table->timestamp('ended_at');
            $table->json('snapshot_data');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('program_snapshots');
    }
};
