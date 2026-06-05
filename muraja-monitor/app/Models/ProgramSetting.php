<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgramSetting extends Model
{
    public $incrementing = false;
    public $timestamps   = false;

    protected $primaryKey = 'key';
    protected $keyType    = 'string';

    protected $fillable = ['key', 'value'];

    public static function get(string $key, mixed $default = null): mixed
    {
        return static::find($key)?->value ?? $default;
    }

    public static function set(string $key, mixed $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
    }
}
