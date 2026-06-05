<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrayerTimesCache extends Model
{
    public $timestamps = false;

    protected $table = 'prayer_times_cache';

    protected $fillable = ['date', 'fajr', 'isha'];

    protected function casts(): array
    {
        return ['date' => 'date'];
    }
}
