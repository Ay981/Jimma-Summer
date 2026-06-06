<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeetingLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'halqa_id', 'leader_id', 'meeting_date', 'meeting_time',
        'attendance_count', 'notes', 'agenda_items', 'attendance',
        'highlights', 'concerns', 'state',
    ];

    protected function casts(): array
    {
        return [
            'meeting_date'  => 'date',
            'agenda_items'  => 'array',
            'attendance'    => 'array',
            'created_at'    => 'datetime',
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

    public function actionItems()
    {
        return $this->hasMany(MeetingActionItem::class, 'meeting_id');
    }
}
