# Overview

KAMIO is a custom sports jersey e-commerce platform that allows users to design and order personalized jerseys for various sports including cricket, football, basketball, badminton, and esports. The platform features a React frontend with Node.js/Express backend, PostgreSQL database with Drizzle ORM, and includes comprehensive user authentication, product catalog management, shopping cart functionality, and customization options.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design system
- **Routing**: wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with custom theming through CSS variables
- **Build System**: Vite with optimized bundling and development server

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: OpenID Connect (OIDC) with Passport.js strategy for Replit authentication
- **Session Management**: Express sessions with PostgreSQL store using connect-pg-simple
- **API Design**: RESTful endpoints with proper error handling and logging middleware

## Data Storage Solutions
- **Primary Database**: PostgreSQL hosted on Neon (serverless PostgreSQL)
- **ORM**: Drizzle ORM with code-first schema definition
- **Schema Management**: Database migrations through drizzle-kit
- **Connection**: Connection pooling with @neondatabase/serverless
- **Session Storage**: PostgreSQL-backed session store for authentication persistence

## Authentication and Authorization
- **Provider**: Replit OIDC for user authentication
- **Strategy**: Passport.js with OpenID Connect strategy
- **Session Management**: Secure HTTP-only cookies with PostgreSQL session store
- **Protection**: Route-level authentication middleware with proper error handling
- **User Management**: Automatic user creation/updates via upsert operations

## Database Schema Design
- **Users**: Core user information with OIDC integration
- **Categories**: Hierarchical product categorization with slug-based routing
- **Products**: Comprehensive product catalog with customization options, pricing, and inventory
- **Cart Items**: User shopping cart with quantity management and product references
- **Wishlist Items**: User favorites with product associations
- **Sessions**: Authentication session persistence

## API Structure
- **User Management**: `/api/user` for authentication and profile data
- **Product Catalog**: `/api/products` and `/api/categories` with filtering and search
- **Shopping Cart**: `/api/cart` with CRUD operations for cart management
- **Wishlist**: `/api/wishlist` for user favorites management
- **Authentication Flow**: `/api/login`, `/api/logout` for OIDC authentication

## Development and Build Process
- **Development**: Hot module replacement with Vite dev server
- **TypeScript**: Strict type checking with path mapping for clean imports
- **Building**: Separate client and server builds with esbuild for server bundling
- **Environment**: Development and production configurations with proper environment variables

# External Dependencies

## Database and Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket connections
- **Drizzle ORM**: Type-safe database operations and schema management
- **Connection Pooling**: @neondatabase/serverless for optimized database connections

## Authentication Services
- **Replit OIDC**: Primary authentication provider with OpenID Connect protocol
- **Passport.js**: Authentication middleware with strategy pattern
- **Session Management**: connect-pg-simple for PostgreSQL-backed session storage

## Frontend Libraries
- **React Ecosystem**: React 18, React DOM, and React Hook Form for form management
- **UI Framework**: Radix UI primitives with shadcn/ui component system
- **State Management**: TanStack Query for server state and caching
- **Styling**: Tailwind CSS with PostCSS processing and autoprefixer
- **Routing**: wouter for lightweight client-side navigation

## Development Tools
- **Build Tools**: Vite with React plugin and TypeScript support
- **Replit Integration**: @replit/vite-plugin-cartographer and runtime error modal
- **Type Safety**: TypeScript with strict configuration and proper type definitions
- **Validation**: Zod for runtime type validation and schema definitions

## Utility Libraries
- **Date Handling**: date-fns for date manipulation and formatting
- **Styling Utilities**: clsx and tailwind-merge for conditional CSS classes
- **Icons**: Lucide React for consistent iconography
- **ID Generation**: nanoid for unique identifier generation