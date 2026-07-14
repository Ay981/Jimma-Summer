<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->bigInteger('telegram_chat_id')->nullable()->unique()->after('telegram_username');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'telegram_chat_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique('users_telegram_chat_id_unique');
                $table->dropColumn('telegram_chat_id');
            });
        }
    }
};
