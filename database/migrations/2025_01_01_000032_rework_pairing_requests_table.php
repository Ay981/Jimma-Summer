<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pairing_requests', function (Blueprint $table) {
            $table->dropColumn(['requested_partner_name', 'requested_partner_phone', 'status']);
            $table->foreignId('requested_partner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('updated_at')->nullable()->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::table('pairing_requests', function (Blueprint $table) {
            $table->dropForeign(['requested_partner_id']);
            $table->dropColumn(['requested_partner_id', 'updated_at']);
            $table->string('requested_partner_name');
            $table->string('requested_partner_phone');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
        });
    }
};
