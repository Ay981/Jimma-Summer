<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MurajaTest extends Model
{
  protected $table = 'muraja_tests';

  protected $fillable = [
    'leader_id',
    'student_id',
    'from_page',
    'to_page',
    'from_juz',
    'to_juz',
    'score',
    'tested_at',
  ];

  protected $casts = [
    'tested_at' => 'date',
  ];

  public function leader(): BelongsTo
  {
    return $this->belongsTo(User::class, 'leader_id');
  }

  public function student(): BelongsTo
  {
    return $this->belongsTo(User::class, 'student_id');
  }
}
