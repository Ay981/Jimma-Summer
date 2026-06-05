<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pair_submissions', function (Blueprint $table) {
            $table->dropForeign(['pair_id']);
            $table->unsignedBigInteger('pair_id')->nullable()->change();
            $table->foreign('pair_id')->references('id')->on('pairs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('pair_submissions', function (Blueprint $table) {
            $table->dropForeign(['pair_id']);
            $table->unsignedBigInteger('pair_id')->nullable(false)->change();
            $table->foreign('pair_id')->references('id')->on('pairs')->cascadeOnDelete();
        });
    }
};
