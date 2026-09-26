import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockSettings } from "@/lib/mock/admin-data";

// import { getAppSettings } from "@/lib/queries";
// import { SettingsForm } from "@/components/admin/settings-form"; // client component for save

export default function SettingsPage() {
  // TODO: Bỏ comment khi kết nối database
  // const settings = await getAppSettings();
  const settings = mockSettings;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Settings"
        description="Configure your platform settings."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General */}
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site_name">Site Name</Label>
              <Input
                id="site_name"
                defaultValue={settings.site_name}
                placeholder="Locketwan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support_email">Support Email</Label>
              <Input
                id="support_email"
                type="email"
                defaultValue={settings.support_email}
                placeholder="support@locketwan.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_upload">Max Upload Size (MB)</Label>
              <Input
                id="max_upload"
                type="number"
                defaultValue={settings.max_upload_size_mb}
                min={1}
                max={100}
              />
            </div>
          </CardContent>
        </Card>

        {/* Access control */}
        <Card>
          <CardHeader>
            <CardTitle>Access Control</CardTitle>
            <CardDescription>Manage user access and registration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Maintenance Mode</p>
                <p className="text-sm text-muted-foreground">
                  Disable public access temporarily
                </p>
              </div>
              <div
                className={`h-6 w-11 rounded-full transition-colors ${
                  settings.maintenance_mode ? "bg-primary" : "bg-muted"
                }`}
              >
                <div
                  className={`mt-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    settings.maintenance_mode
                      ? "translate-x-5"
                      : "translate-x-0.5"
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Allow Registrations</p>
                <p className="text-sm text-muted-foreground">
                  Let new users sign up
                </p>
              </div>
              <div
                className={`h-6 w-11 rounded-full transition-colors ${
                  settings.allow_registrations ? "bg-primary" : "bg-muted"
                }`}
              >
                <div
                  className={`mt-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    settings.allow_registrations
                      ? "translate-x-5"
                      : "translate-x-0.5"
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_plan">Default Plan for New Users</Label>
              <select
                id="default_plan"
                defaultValue={settings.default_plan}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="pro">Pro</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}
