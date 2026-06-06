<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PdfExport extends Model
{
    protected $fillable = ['requested_by', 'report_type', 'status', 'file_path', 'error_message', 'ready_at'];

    protected function casts(): array
    {
        return ['ready_at' => 'datetime'];
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
