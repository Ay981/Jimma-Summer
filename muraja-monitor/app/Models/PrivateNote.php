<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrivateNote extends Model
{
    public $timestamps = false;

    protected $fillable = ['student_id', 'leader_id', 'note'];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function leader()
    {
        return $this->belongsTo(User::class, 'leader_id');
    }
}
