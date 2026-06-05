<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeetingActionItem extends Model
{
    public $timestamps = false;

    protected $table = 'meeting_action_items';

    protected $fillable = ['meeting_id', 'student_id', 'description', 'due_date', 'status', 'resolved_at'];

    protected function casts(): array
    {
        return ['due_date' => 'date', 'resolved_at' => 'datetime'];
    }

    public function meeting()
    {
        return $this->belongsTo(MeetingLog::class, 'meeting_id');
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
