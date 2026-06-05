<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PairSubmission extends Model
{
    protected $fillable = [
        'pair_id',
        'submitted_by',
        'subject_student_id',
        'juz',
        'page_from',
        'page_to',
        'minutes_spent',
        'submission_date',
        'submitted_at',
        'edited_at',
        'is_edited',
        'is_flagged',
        'flag_verdict',
        'flag_reviewed_by',
        'flag_reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'submission_date'  => 'date',
            'submitted_at'     => 'datetime',
            'edited_at'        => 'datetime',
            'flag_reviewed_at' => 'datetime',
            'is_edited'        => 'boolean',
            'is_flagged'       => 'boolean',
        ];
    }

    public function flagReviewer()
    {
        return $this->belongsTo(User::class, 'flag_reviewed_by');
    }

    public function pair()
    {
        return $this->belongsTo(Pair::class);
    }

    public function submitter()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function subject()
    {
        return $this->belongsTo(User::class, 'subject_student_id');
    }
}
