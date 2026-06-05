<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Watchlist extends Model
{
    public $timestamps = false;

    protected $fillable = ['student_id', 'added_by', 'added_at', 'resolved_at'];

    protected function casts(): array
    {
        return [
            'added_at'    => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by');
    }
}
