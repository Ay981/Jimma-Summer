<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pairs', function (Blueprint $table) {
            $table->unsignedTinyInteger('compatibility_score')->nullable()->after('status');
            $table->boolean('needs_review')->default(false)->after('compatibility_score');
        });
    }

    public function down(): void
    {
        Schema::table('pairs', function (Blueprint $table) {
            $table->dropColumn(['compatibility_score', 'needs_review']);
        });
    }
};
