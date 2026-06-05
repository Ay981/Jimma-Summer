<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeaderEscalation extends Model
{
    public $timestamps = false;

    protected $fillable = ['student_id', 'leader_id', 'note_summary', 'dismissed'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime', 'dismissed' => 'boolean'];
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function leader()
    {
        return $this->belongsTo(User::class, 'leader_id');
    }
}
