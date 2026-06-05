<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prayer_times_cache', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();
            $table->time('fajr');
            $table->time('isha');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prayer_times_cache');
    }
};
