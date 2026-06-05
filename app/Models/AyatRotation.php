<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AyatRotation extends Model
{
    protected $table = 'ayat_rotation';

    public $timestamps = false;

    protected $fillable = ['text', 'reference'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }
}
