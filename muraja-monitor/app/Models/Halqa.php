<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Halqa extends Model
{
    public $timestamps = false;

    protected $fillable = ['name', 'leader_id'];

    public function leader()
    {
        return $this->belongsTo(User::class, 'leader_id');
    }

    public function members()
    {
        return $this->hasMany(User::class);
    }

    public function pairs()
    {
        return $this->hasMany(Pair::class);
    }

    public function announcements()
    {
        return $this->hasMany(Announcement::class);
    }

    public function leaderCodes()
    {
        return $this->hasMany(LeaderCode::class);
    }
}
