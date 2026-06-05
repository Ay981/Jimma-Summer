<?php

namespace App\Models;

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
}
