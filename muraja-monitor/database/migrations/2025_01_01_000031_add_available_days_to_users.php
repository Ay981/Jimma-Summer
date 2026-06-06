<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * available_days stores the days of the week a student is available
 * (e.g. ['monday', 'wednesday', 'friday']).
 * Separate from available_times which stores prayer-slot preferences.
 * ConsistencyService uses available_days to decide which days count
 * toward streak and consistency %.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('available_days')->nullable()->after('available_times');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('available_days');
        });
    }
};
