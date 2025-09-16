import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  Settings as SettingsIcon, 
  User, 
  Building, 
  Crown,
  Shield,
  Bell,
  Palette,
  Database
} from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Your personal account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <div className="flex items-center gap-2">
                <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'}>
                  {user?.role}
                </Badge>
                {user?.role === 'admin' && (
                  <Shield className="w-4 h-4 text-primary" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Organization
          </CardTitle>
          <CardDescription>
            Your organization details and subscription
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Organization</p>
              <p className="font-medium">{user?.tenant.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Plan</p>
              <div className="flex items-center gap-2">
                <Badge variant={user?.tenant.plan === 'pro' ? 'default' : 'secondary'}>
                  {user?.tenant.plan === 'pro' ? (
                    <>
                      <Crown className="w-3 h-3 mr-1" />
                      Pro
                    </>
                  ) : (
                    'Free'
                  )}
                </Badge>
              </div>
            </div>
          </div>
          
          {user?.tenant.plan === 'free' && user?.role === 'admin' && (
            <div className="p-4 bg-gradient-primary rounded-lg text-white">
              <h4 className="font-medium mb-2">Upgrade to Pro</h4>
              <p className="text-sm text-white/80 mb-3">
                Unlock unlimited notes, advanced features, and priority support
              </p>
              <Button 
                size="sm" 
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
              >
                <Crown className="w-3 h-3 mr-1" />
                Upgrade Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Application Preferences
          </CardTitle>
          <CardDescription>
            Customize your app experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Notifications</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Email notifications are enabled for your account
              </p>
              <Button variant="outline" size="sm">
                Manage Notifications
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Theme</span>
              </div>
              <p className="text-sm text-muted-foreground">
                System theme (auto light/dark mode)
              </p>
              <Button variant="outline" size="sm">
                Change Theme
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data & Privacy
          </CardTitle>
          <CardDescription>
            Manage your data and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Your notes are stored securely with end-to-end encryption and are only accessible by your organization.
            </p>
            <p>
              We follow industry-standard security practices to protect your data.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Export Data
            </Button>
            <Button variant="outline" size="sm">
              Privacy Policy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;