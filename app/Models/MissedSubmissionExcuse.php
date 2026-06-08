<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MissedSubmissionExcuse extends Model
{
    protected $fillable = [
        'student_id',
        'missed_date',
        'reason',
        'makeup_date',
        'fulfilled',
    ];

    protected function casts(): array
    {
        return [
            'missed_date'  => 'date',
            'makeup_date'  => 'date',
            'fulfilled'    => 'boolean',
        ];
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
