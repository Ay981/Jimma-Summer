<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PairingRequest extends Model
{
    protected $fillable = [
        'student_id',
        'requested_partner_id',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function requestedPartner()
    {
        return $this->belongsTo(User::class, 'requested_partner_id');
    }
}
