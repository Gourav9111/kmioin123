import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ProductGrid from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import type { Product, Category } from "@shared/schema";

export default function Products() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Get category from URL params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const categoryParam = urlParams.get('category') || '';

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", searchTerm, selectedCategory || categoryParam],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory || categoryParam) {
        params.append('categoryId', selectedCategory || categoryParam);
      }
      
      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      
      // Additional client-side filtering to ensure products match their categories
      if (selectedCategory || categoryParam) {
        const targetCategoryId = selectedCategory || categoryParam;
        return data.filter((product: Product) => product.categoryId === targetCategoryId);
      }
      
      return data;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the query dependency
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-products-title">
            <span className="text-primary">CUSTOM SPORTS</span> <span className="text-foreground">JERSEYS</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover our premium collection of customizable jerseys for all sports
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md" data-testid="form-search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search jerseys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </form>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Filter */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-muted-foreground" data-testid="text-results-count">
            {productsLoading ? "Loading..." : `${products.length} products found`}
          </p>
        </div>

        {/* Products Grid */}
        {productsLoading ? (
          <div className="flex justify-center py-12" data-testid="loading-products">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12" data-testid="no-products">
            <p className="text-muted-foreground text-lg mb-4">No products found</p>
            <Button 
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
              }}
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>

      <Footer />
    </div>
  );
}
