<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Badge extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'badge_type', 'earned_at'];

    protected function casts(): array
    {
        return ['earned_at' => 'datetime'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
