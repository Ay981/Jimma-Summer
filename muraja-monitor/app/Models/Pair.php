<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pair extends Model
{
    public $timestamps = false;

    protected $fillable = ['student_a_id', 'student_b_id', 'halqa_id', 'status'];

    public function studentA()
    {
        return $this->belongsTo(User::class, 'student_a_id');
    }

    public function studentB()
    {
        return $this->belongsTo(User::class, 'student_b_id');
    }

    public function halqa()
    {
        return $this->belongsTo(Halqa::class);
    }

    public function submissions()
    {
        return $this->hasMany(PairSubmission::class);
    }
}
