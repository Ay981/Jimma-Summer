<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeetingLog extends Model
{
    public $timestamps = false;

    protected $fillable = ['halqa_id', 'leader_id', 'meeting_date', 'attendance_count', 'notes'];

    protected function casts(): array
    {
        return [
            'meeting_date' => 'date',
            'created_at'   => 'datetime',
        ];
    }

    public function halqa()
    {
        return $this->belongsTo(Halqa::class);
    }

    public function leader()
    {
        return $this->belongsTo(User::class, 'leader_id');
    }
}
