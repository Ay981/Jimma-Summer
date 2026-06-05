<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PairingRequest extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'student_id',
        'requested_partner_name',
        'requested_partner_phone',
        'status',
    ];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
