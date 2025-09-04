
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();

  // Check if user is admin (you can customize this logic)
  const isAdmin = user?.email?.includes('admin') || user?.firstName === 'Admin';

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p>Please log in to access the admin panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p>Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">Welcome, {user?.firstName}</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$--</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Products Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Button>Add New Product</Button>
              <p className="mt-4 text-muted-foreground">Product management features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Orders Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Orders management features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">User management features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
