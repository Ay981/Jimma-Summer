<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgramSnapshot extends Model
{
    public $timestamps = false;

    protected $fillable = ['program_name', 'ended_at', 'snapshot_data', 'report_pdf_path'];

    protected function casts(): array
    {
        return [
            'ended_at'      => 'datetime',
            'snapshot_data' => 'array',
            'created_at'    => 'datetime',
        ];
    }
}
