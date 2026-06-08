<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('program_snapshots', function (Blueprint $table) {
            $table->string('report_pdf_path')->nullable()->after('snapshot_data');
        });
    }

    public function down(): void
    {
        Schema::table('program_snapshots', function (Blueprint $table) {
            $table->dropColumn('report_pdf_path');
        });
    }
};
