<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'student_id',
        'phone',
        'telegram_username',
        'password',
        'role',
        'halqa_id',
        'weekly_target',
        'current_juz',
        'memo_level',
        'available_times',
        'available_days',
        'is_active',
        'is_monitored',
        'is_solo',
        'must_change_password',
        'profile_completed',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'phone',
        'telegram_username',
        'memo_level',
        'current_juz',
        'available_times',
        'available_days',
        'is_monitored',
    ];

    protected function casts(): array
    {
        return [
            'password'             => 'hashed',
            'available_times'      => 'array',
            'available_days'       => 'array',
            'is_active'            => 'boolean',
            'is_monitored'         => 'boolean',
            'is_solo'              => 'boolean',
            'must_change_password' => 'boolean',
            'profile_completed'    => 'boolean',
        ];
    }

    // ── Relationships ────────────────────────────────────────────────────────

    public function halqa()
    {
        return $this->belongsTo(Halqa::class);
    }

    public function ledHalqa()
    {
        return $this->hasOne(Halqa::class, 'leader_id');
    }

    public function pairAsStudentA()
    {
        return $this->hasMany(Pair::class, 'student_a_id');
    }

    public function pairAsStudentB()
    {
        return $this->hasMany(Pair::class, 'student_b_id');
    }

    public function submissionsFiledBy()
    {
        return $this->hasMany(PairSubmission::class, 'submitted_by');
    }

    public function submissionsAbout()
    {
        return $this->hasMany(PairSubmission::class, 'subject_student_id');
    }

    public function contactLogs()
    {
        return $this->hasMany(ContactLog::class, 'student_id');
    }

    public function watchlistEntries()
    {
        return $this->hasMany(Watchlist::class, 'student_id');
    }

    public function badges()
    {
        return $this->hasMany(Badge::class, 'user_id');
    }

    public function announcements()
    {
        return $this->hasMany(Announcement::class, 'posted_by');
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class, 'user_id');
    }

    public function pairingRequests()
    {
        return $this->hasMany(PairingRequest::class, 'student_id');
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isLeader(): bool
    {
        return $this->role === 'leader';
    }

    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    public function dashboardRoute(): string
    {
        return match ($this->role) {
            'admin'  => '/admin/dashboard',
            'leader' => '/leader/dashboard',
            default  => '/student/dashboard',
        };
    }
}
