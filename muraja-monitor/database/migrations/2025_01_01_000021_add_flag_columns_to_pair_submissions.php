<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pair_submissions', function (Blueprint $table) {
            $table->boolean('is_flagged')->default(false)->after('is_edited');
            $table->enum('flag_verdict', ['verified', 'rejected'])->nullable()->after('is_flagged');
            $table->foreignId('flag_reviewed_by')->nullable()->constrained('users')->nullOnDelete()->after('flag_verdict');
            $table->timestamp('flag_reviewed_at')->nullable()->after('flag_reviewed_by');
        });
    }

    public function down(): void
    {
        Schema::table('pair_submissions', function (Blueprint $table) {
            $table->dropForeign(['flag_reviewed_by']);
            $table->dropColumn(['is_flagged', 'flag_verdict', 'flag_reviewed_by', 'flag_reviewed_at']);
        });
    }
};
