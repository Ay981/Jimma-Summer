<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PairChangeRequest extends Model
{
    protected $fillable = [
        'requested_by', 'current_pair_id', 'current_partner_id', 'requested_partner_id',
        'reason', 'type', 'status', 'requested_at', 'leader_id',
        'reviewed_by', 'reviewed_at', 'rejection_reason',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'reviewed_at'  => 'datetime',
    ];

    public function student(): BelongsTo      { return $this->belongsTo(User::class, 'requested_by'); }
    public function pair(): BelongsTo         { return $this->belongsTo(Pair::class, 'current_pair_id'); }
    public function currentPartner(): BelongsTo   { return $this->belongsTo(User::class, 'current_partner_id'); }
    public function requestedPartner(): BelongsTo { return $this->belongsTo(User::class, 'requested_partner_id'); }
    public function leader(): BelongsTo       { return $this->belongsTo(User::class, 'leader_id'); }
    public function reviewer(): BelongsTo     { return $this->belongsTo(User::class, 'reviewed_by'); }
}
