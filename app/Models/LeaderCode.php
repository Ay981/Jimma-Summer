<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeaderCode extends Model
{
    public $timestamps = false;

    protected $fillable = ['halqa_id', 'code', 'is_active', 'used_by'];

    protected function casts(): array
    {
        return [
            'is_active'  => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function halqa()
    {
        return $this->belongsTo(Halqa::class);
    }

    public function usedByUser()
    {
        return $this->belongsTo(User::class, 'used_by');
    }
}
