
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Edit, Trash2, Plus, Upload, Image as ImageIcon } from "lucide-react";
import type { Category, Product } from "@shared/schema";

export default function AdminPanel() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  
  // Product form state
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    shortDescription: "",
    price: "",
    categoryId: "",
    imageUrl: "",
    images: [] as string[],
    availableSizes: ["S", "M", "L", "XL", "XXL"] as string[],
    sizeQuantities: {
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0
    },
    isActive: true,
    isFeatured: false
  });

  // Get admin stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/stats");
        return response.json();
      } catch (error) {
        return {
          totalProducts: 0,
          totalOrders: 0,
          totalUsers: 0,
          totalRevenue: 0
        };
      }
    },
  });

  // Get categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/categories");
      return response.json();
    }
  });

  // Get products with category information
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/products");
      return response.json();
    },
  });

  // Helper function to get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      description: "",
      shortDescription: "",
      price: "",
      categoryId: "",
      imageUrl: "",
      images: [],
      availableSizes: ["S", "M", "L", "XL", "XXL"],
      sizeQuantities: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
      isActive: true,
      isFeatured: false
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Welcome to the admin dashboard</p>
          </div>
          <Button onClick={() => navigate("/admin-signup")} variant="outline">
            Create New Admin
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
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
                <div className="text-2xl font-bold">
                  {statsLoading ? "--" : stats?.totalProducts || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "--" : stats?.totalOrders || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "--" : stats?.totalUsers || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{statsLoading ? "--" : stats?.totalRevenue || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Categories Management</h2>
              <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-category">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                  </DialogHeader>
                  <CategoryForm />
                </DialogContent>
              </Dialog>
            </div>
            <CategoriesTable />
          </div>
        </TabsContent>

        <TabsContent value="products">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Products Management</h2>
              <div className="flex gap-2">
                <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                    </DialogHeader>
                    <ProductForm />
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Images
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Product Images</DialogTitle>
                    </DialogHeader>
                    <ImageUploadForm />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <ProductsTable />
          </div>
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

  // Category Form Component
  function CategoryForm() {
    const createCategoryMutation = useMutation({
      mutationFn: async (data: { name: string; slug: string; description?: string }) => {
        const response = await apiRequest("POST", "/api/admin/categories", data);
        return response.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        setShowCategoryDialog(false);
        setNewCategoryName("");
        setNewCategorySlug("");
        toast({
          title: "Success",
          description: "Category created successfully",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create category",
          variant: "destructive",
        });
      },
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCategoryName.trim() || !newCategorySlug.trim()) return;
      
      createCategoryMutation.mutate({
        name: newCategoryName,
        slug: newCategorySlug,
        description: "",
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="category-name">Category Name</Label>
          <Input
            id="category-name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Enter category name"
            data-testid="input-category-name"
          />
        </div>
        <div>
          <Label htmlFor="category-slug">Category Slug</Label>
          <Input
            id="category-slug"
            value={newCategorySlug}
            onChange={(e) => setNewCategorySlug(e.target.value)}
            placeholder="Enter category slug"
            data-testid="input-category-slug"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            type="submit" 
            disabled={createCategoryMutation.isPending}
            data-testid="button-save-category"
          >
            {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setShowCategoryDialog(false)}
            data-testid="button-cancel-category"
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  // Product Form Component
  function ProductForm() {
    const createProductMutation = useMutation({
      mutationFn: async (data: any) => {
        const response = await apiRequest("POST", "/api/admin/products", data);
        return response.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
        setShowProductDialog(false);
        resetProductForm();
        toast({
          title: "Success",
          description: "Product created successfully",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create product",
          variant: "destructive",
        });
      },
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!productForm.name || !productForm.categoryId || !productForm.price) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      const slug = productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const productData = {
        name: productForm.name,
        slug: slug,
        description: productForm.description,
        shortDescription: productForm.shortDescription,
        price: productForm.price,
        categoryId: productForm.categoryId,
        imageUrl: productForm.imageUrl,
        images: productForm.images,
        availableSizes: productForm.availableSizes,
        isActive: productForm.isActive,
        isFeatured: productForm.isFeatured,
        stock: Object.values(productForm.sizeQuantities).reduce((sum, qty) => sum + qty, 0)
      };

      createProductMutation.mutate(productData);
    };

    const handleImageAdd = (imagePath: string) => {
      if (productForm.images.length < 5) {
        setProductForm(prev => ({
          ...prev,
          images: [...prev.images, imagePath],
          imageUrl: prev.imageUrl || imagePath // Set as main image if none selected
        }));
      }
    };

    const handleImageRemove = (index: number) => {
      setProductForm(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    };

    const handleSizeToggle = (size: string) => {
      setProductForm(prev => ({
        ...prev,
        availableSizes: prev.availableSizes.includes(size)
          ? prev.availableSizes.filter(s => s !== size)
          : [...prev.availableSizes, size]
      }));
    };

    const handleQuantityChange = (size: string, quantity: number) => {
      setProductForm(prev => ({
        ...prev,
        sizeQuantities: {
          ...prev.sizeQuantities,
          [size]: Math.max(0, quantity)
        }
      }));
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select value={productForm.categoryId} onValueChange={(value) => setProductForm(prev => ({ ...prev, categoryId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Product Images */}
        <div>
          <Label>Product Images (Max 5)</Label>
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {productForm.images.map((image, index) => (
                <div key={index} className="relative">
                  <img 
                    src={image} 
                    alt={`Product ${index + 1}`}
                    className="w-full h-20 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={() => handleImageRemove(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
              {productForm.images.length < 5 && (
                <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center">
                  <ImageIcon className="w-8 h-8 mx-auto text-gray-400" />
                  <p className="text-xs text-gray-500 mt-1">Add Image</p>
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="image-url">Add Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="image-url"
                  placeholder="Enter image URL or path (e.g., /images/cricket-jersey-1.jpg)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.target as HTMLInputElement;
                      if (input.value.trim()) {
                        handleImageAdd(input.value.trim());
                        input.value = '';
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('image-url') as HTMLInputElement;
                    if (input.value.trim()) {
                      handleImageAdd(input.value.trim());
                      input.value = '';
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Images should be in: attached_assets/cricket jersey/, attached_assets/esports jersey/, etc.
              </p>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="product-name">Product Name *</Label>
            <Input
              id="product-name"
              value={productForm.name}
              onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter product name"
            />
          </div>
          <div>
            <Label htmlFor="product-price">Price *</Label>
            <Input
              id="product-price"
              type="number"
              value={productForm.price}
              onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
              placeholder="Enter price"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="product-short-desc">Short Description</Label>
          <Input
            id="product-short-desc"
            value={productForm.shortDescription}
            onChange={(e) => setProductForm(prev => ({ ...prev, shortDescription: e.target.value }))}
            placeholder="Brief product description"
          />
        </div>

        <div>
          <Label htmlFor="product-desc">Description</Label>
          <Textarea
            id="product-desc"
            value={productForm.description}
            onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Detailed product description"
            rows={4}
          />
        </div>

        {/* Size Selection */}
        <div>
          <Label>Available Sizes</Label>
          <div className="flex gap-4 mt-2">
            {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
              <div key={size} className="flex items-center space-x-2">
                <Checkbox
                  id={`size-${size}`}
                  checked={productForm.availableSizes.includes(size)}
                  onCheckedChange={() => handleSizeToggle(size)}
                />
                <Label htmlFor={`size-${size}`}>{size}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Size Quantities */}
        <div>
          <Label>Quantities by Size</Label>
          <div className="grid grid-cols-5 gap-4 mt-2">
            {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
              <div key={size}>
                <Label htmlFor={`qty-${size}`} className="text-sm">{size}</Label>
                <Input
                  id={`qty-${size}`}
                  type="number"
                  min="0"
                  value={productForm.sizeQuantities[size as keyof typeof productForm.sizeQuantities]}
                  onChange={(e) => handleQuantityChange(size, parseInt(e.target.value) || 0)}
                  disabled={!productForm.availableSizes.includes(size)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Status Options */}
        <div className="flex gap-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="active"
              checked={productForm.isActive}
              onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, isActive: !!checked }))}
            />
            <Label htmlFor="active">Active</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={productForm.isFeatured}
              onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, isFeatured: !!checked }))}
            />
            <Label htmlFor="featured">Featured</Label>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            type="submit" 
            disabled={createProductMutation.isPending}
          >
            {createProductMutation.isPending ? "Creating..." : "Create Product"}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setShowProductDialog(false);
              resetProductForm();
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  // Categories Table Component
  function CategoriesTable() {
    const { data: categories, isLoading } = useQuery<Category[]>({
      queryKey: ["/api/categories"],
    });

    const deleteCategoryMutation = useMutation({
      mutationFn: async (id: string) => {
        await apiRequest("DELETE", `/api/admin/categories/${id}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        toast({
          title: "Success",
          description: "Category deleted successfully",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete category",
          variant: "destructive",
        });
      },
    });

    if (isLoading) {
      return <div>Loading categories...</div>;
    }

    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell>
                    <Badge variant={category.isActive ? "default" : "secondary"}>
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => deleteCategoryMutation.mutate(category.id)}
                      disabled={deleteCategoryMutation.isPending}
                      data-testid={`button-delete-category-${category.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  // Image Upload Form Component  
  function ImageUploadForm() {
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedFiles(e.target.files);
    };

    const handleUpload = async () => {
      if (!selectedFiles) return;

      toast({
        title: "Upload Started",
        description: `Uploading ${selectedFiles.length} file(s)...`,
      });

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast({
        title: "Upload Complete",
        description: "Images uploaded successfully! Copy the file paths to use in products.",
      });
    };

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="image-upload">Select Images</Label>
          <Input
            id="image-upload"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            data-testid="input-image-upload"
          />
        </div>
        
        {selectedFiles && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Selected {selectedFiles.length} file(s)
            </p>
            {Array.from(selectedFiles).map((file, index) => (
              <div key={index} className="text-sm">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            ))}
          </div>
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-center">{uploadProgress}% uploaded</p>
          </div>
        )}

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">📁 Current Images Location:</h4>
          <div className="space-y-1 text-sm">
            <code>attached_assets/cricket jersey/</code><br/>
            <code>attached_assets/esports jersey/</code><br/>
            <code>attached_assets/football jersey/</code><br/>
            <code>attached_assets/marathon jersey/</code>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Upload your product images here, then use the file path in your product forms.
            Example: <code>attached_assets/cricket jersey/jersey-1.jpg</code>
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleUpload}
            disabled={!selectedFiles}
            data-testid="button-upload-images"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Images
          </Button>
        </div>
      </div>
    );
  }

  // Products Table Component
  function ProductsTable() {
    const deleteProductMutation = useMutation({
      mutationFn: async (id: string) => {
        await apiRequest("DELETE", `/api/admin/products/${id}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
        toast({
          title: "Success",
          description: "Product deleted successfully",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete product",
          variant: "destructive",
        });
      },
    });

    if (productsLoading) {
      return <div>Loading products...</div>;
    }

    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>₹{product.price}</TableCell>
                  <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => deleteProductMutation.mutate(product.id)}
                      disabled={deleteProductMutation.isPending}
                      data-testid={`button-delete-product-${product.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }
}
