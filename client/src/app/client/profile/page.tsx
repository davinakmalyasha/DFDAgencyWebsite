'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { toast } from 'sonner';

export default function ProfilePage() {
    const [me, setMe] = useState<{ id: number; username: string; email: string; role: string } | null>(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/auth/me')
            .then((res) => setMe(res.data.data?.user || null))
            .catch(() => setMe(null));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            toast.error('New password must be at least 8 characters');
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                currentPassword,
                newPassword,
            });
            toast.success('Password changed. Other sessions were terminated.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-md space-y-8">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tight">Profile</h1>
                {me && (
                    <div className="mt-4 space-y-1 text-sm">
                        <p><span className="font-bold">Username:</span> {me.username}</p>
                        <p><span className="font-bold">Email:</span> {me.email}</p>
                        <p><span className="font-bold">Role:</span> {me.role}</p>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 border-2 border-foreground p-6">
                <h2 className="text-lg font-black uppercase tracking-tight">Change Password</h2>
                <div>
                    <label className="block text-sm font-bold mb-1">Current Password</label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full border-2 border-foreground px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-1">New Password</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        className="w-full border-2 border-foreground px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
                    />
                    <p className="text-xs mt-1 text-muted-foreground">At least 8 characters, letters + numbers.</p>
                </div>
                <div>
                    <label className="block text-sm font-bold mb-1">Confirm New Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        className="w-full border-2 border-foreground px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-foreground text-background font-bold py-2 px-4 text-sm uppercase tracking-wide disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Change Password'}
                </button>
            </form>
        </div>
    );
}
