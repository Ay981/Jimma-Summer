<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    public $timestamps = false;

    protected $fillable = ['posted_by', 'halqa_id', 'title', 'body'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function poster()
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function halqa()
    {
        return $this->belongsTo(Halqa::class);
    }

    /**
     * Active announcements: created on or after program_start_date
     * and on or before program_end_date (if set).
     */
    public function scopeActive(Builder $query): Builder
    {
        $start = ProgramSetting::get('program_start_date');
        $end   = ProgramSetting::get('program_end_date');

        if ($start) {
            $query->where('created_at', '>=', $start . ' 00:00:00');
        }
        if ($end) {
            $query->where('created_at', '<=', $end . ' 23:59:59');
        }

        return $query;
    }
}
