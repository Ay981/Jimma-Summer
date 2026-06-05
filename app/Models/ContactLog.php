<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'student_id', 'contacted_by', 'method', 'note',
        'contacted_at', 'follow_up_required', 'snooze_until', 'outcome',
    ];

    protected function casts(): array
    {
        return [
            'contacted_at'       => 'datetime',
            'snooze_until'       => 'date',
            'follow_up_required' => 'boolean',
        ];
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function contactedBy()
    {
        return $this->belongsTo(User::class, 'contacted_by');
    }
}
