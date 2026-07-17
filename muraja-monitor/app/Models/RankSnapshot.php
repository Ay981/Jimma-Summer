<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RankSnapshot extends Model
{
    protected $table = 'rank_snapshots';

    protected $fillable = [
        'subject_type',
        'subject_id',
        'rank',
        'rank_score',
        'captured_on',
    ];

    protected $casts = [
        'rank'        => 'integer',
        'rank_score'  => 'float',
        'captured_on' => 'date',
    ];

    public function subject(): BelongsTo
    {
        return $this->belongsTo(User::class, 'subject_id');
    }
}
