import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import ProductCard from "@/components/product/product-card";
import type { Product, Category } from "@shared/schema";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  // Ensure categories is always an array
  const safeCategories = Array.isArray(categories) ? categories : [];

  // Fetch products with filters
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products", selectedCategory, searchTerm],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("categoryId", selectedCategory);
      if (searchTerm) params.append("search", searchTerm);

      const queryString = params.toString();
      return apiRequest("GET", `/api/products${queryString ? `?${queryString}` : ""}`);
    },
  });

  // Sort products
  const sortedProducts = products.sort((a: Product, b: Product) => {
    switch (sortBy) {
      case "price-low":
        return parseFloat(a.salePrice || a.price) - parseFloat(b.salePrice || b.price);
      case "price-high":
        return parseFloat(b.salePrice || b.price) - parseFloat(a.salePrice || a.price);
      case "name":
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSortBy("name");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Our Products</h1>
        <p className="text-xl text-muted-foreground">
          Discover our collection of premium custom jerseys
        </p>
      </div>

      {/* Category Cards */}
      {!categoriesLoading && safeCategories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {safeCategories.map((category: Category) => (
              <Card 
                key={category.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => setSelectedCategory(category.id)}
              >
                <CardContent className="p-4 text-center">
                  <img
                    src={category.imageUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"}
                    alt={category.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-lg p-6 mb-8 border">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {safeCategories.map((category: Category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          {(searchTerm || selectedCategory || sortBy !== "name") && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {(searchTerm || selectedCategory) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {searchTerm && (
            <Badge variant="secondary" className="px-3 py-1">
              Search: "{searchTerm}"
              <button
                onClick={() => setSearchTerm("")}
                className="ml-2 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )}
          {selectedCategory && (
            <Badge variant="secondary" className="px-3 py-1">
              Category: {safeCategories.find((c: Category) => c.id === selectedCategory)?.name}
              <button
                onClick={() => setSelectedCategory("")}
                className="ml-2 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Loading State */}
      {(productsLoading || categoriesLoading) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-[4/5] rounded-t-lg"></div>
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {!productsLoading && !categoriesLoading && (
        <>
          {sortedProducts.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <p className="text-muted-foreground">
                  Showing {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''}
                  {selectedCategory && (
                    <span> in {safeCategories.find((c: Category) => c.id === selectedCategory)?.name}</span>
                  )}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedProducts.map((product: Product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filter criteria
              </p>
              <Button onClick={clearFilters}>Clear All Filters</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}