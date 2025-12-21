import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/page/commons/ProtectedRoute';
import RootPage from '@/page/client';
import AdminPage from '@/page/admin';

// Auth Pages
import AuthPage from '@/page/client/auth-page';
import ResetPasswordPage from '@/page/client/auth-page/ResetPasswordPage';

// Client Pages
import HomePage from '@/page/client/home';
import ProductListPage from '@/page/client/products';
import ProductDetailPage from '@/page/client/products/product-detail';
import CartPage from '@/page/client/cart';
import PaymentCallbackPage from '@/page/client/payment/payment-callback';

// User Pages
import UserInfoPage from '@/page/user/user-info-page';
import UserSessionPage from '@/page/user/user-session-page';
import OrderHistoryPage from '@/page/user/order-history-page';
import OrderDetailPage from '@/page/user/order-detail-page';
import NotificationPage from '@/page/user/notification-page';
import ReviewHistoryPage from '@/page/user/review-history-page';

// Admin Pages
import AdminDashboard from '@/page/admin/dashboard';
import UserManagerPage from '@/page/admin/user-page/user-manager-page';
import UserUpsertPage from '@/page/admin/user-page/user-upsert-page';
import { ProductManagementPage } from '@/page/admin/products';
import { CategoryManagementPage } from '@/page/admin/categories';
import { ReviewManagementPage } from '@/page/admin/reviews';
import { OrderManagementPage } from '@/page/admin/orders';
import { InventoryManagementPage } from '@/page/admin/inventory';
import AccessControlPage from '@/page/admin/access-controller-page';
import PermissionPage from '@/page/admin/access-controller-page/permission-page';
import RolePage from '@/page/admin/access-controller-page/role-page';
import MonitorLayout from '@/page/admin/monitor/layout';
import DashboardPage from '@/page/admin/monitor/dashboard';
import HealthPage from '@/page/admin/monitor/health';
import MetricsPage from '@/page/admin/monitor/metrics';

// Error Pages
import NotFoundPage from '@/page/commons/not-found';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <RootPage />,
        children: [
            // Public Routes
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: 'products',
                element: <ProductListPage />,
            },
            {
                path: 'products/:id',
                element: <ProductDetailPage />,
            },



            // Protected User Routes
            {
                path: 'user/info',  // Đồng bộ với UserMenu link
                element: (
                    <ProtectedRoute to="/auth?mode=login">
                        <UserInfoPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'user/sessions',  // Đồng bộ với UserMenu link
                element: (
                    <ProtectedRoute to="/auth?mode=login">
                        <UserSessionPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'user/orders',
                element: (
                    <ProtectedRoute to="/auth?mode=login">
                        <OrderHistoryPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'user/orders/:id',
                element: (
                    <ProtectedRoute to="/auth?mode=login">
                        <OrderDetailPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'user/notifications',
                element: (
                    <ProtectedRoute to="/auth?mode=login">
                        <NotificationPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'user/reviews',
                element: (
                    <ProtectedRoute to="/auth?mode=login">
                        <ReviewHistoryPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'cart',
                element: (
                    <ProtectedRoute to="/auth?mode=login">
                        <CartPage />
                    </ProtectedRoute>
                ),
            },

            {
                path: 'payment/callback',
                element: <PaymentCallbackPage />,
            },
        ],
    },

    // Admin Routes
    {
        path: '/admin',
        element: (
            <ProtectedRoute requiredPermission="GET /api/orders/admin/all" to="/auth?mode=login">
                <AdminPage />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <AdminDashboard />,
            },

            // User Management
            {
                path: 'users',
                element: (
                    <ProtectedRoute requiredPermission="GET /api/users" to="/admin">
                        <UserManagerPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'users/upsert',
                element: <UserUpsertPage />,
            },

            // Product Management
            {
                path: 'products',
                element: (
                    <ProtectedRoute requiredPermission="POST /api/products" to="/admin">
                        <ProductManagementPage />
                    </ProtectedRoute>
                ),
            },

            // Category Management
            {
                path: 'categories',
                element: (
                    <ProtectedRoute requiredPermission="POST /api/categories" to="/admin">
                        <CategoryManagementPage />
                    </ProtectedRoute>
                ),
            },

            // Review Management
            {
                path: 'reviews',
                element: (
                    <ProtectedRoute requiredPermission="DELETE /api/reviews/{id}" to="/admin">
                        <ReviewManagementPage />
                    </ProtectedRoute>
                ),
            },

            // Order Management
            {
                path: 'orders',
                element: (
                    <ProtectedRoute requiredPermission="GET /api/orders/admin/all" to="/admin">
                        <OrderManagementPage />
                    </ProtectedRoute>
                ),
            },

            // Inventory Management
            {
                path: 'inventory',
                element: (
                    <ProtectedRoute requiredPermission="GET /api/inventory" to="/admin">
                        <InventoryManagementPage />
                    </ProtectedRoute>
                ),
            },

            // Access Control (Nested Routes)
            {
                path: 'access-control',
                element: <AccessControlPage />,
                children: [
                    {
                        path: 'permissions',
                        element: (
                            <ProtectedRoute requiredPermission="GET /api/permissions" to="/admin">
                                <PermissionPage />
                            </ProtectedRoute>
                        ),
                    },
                    {
                        path: 'roles',
                        element: (
                            <ProtectedRoute requiredPermission="GET /api/roles" to="/admin">
                                <RolePage />
                            </ProtectedRoute>
                        ),
                    },
                ],
            },

            // Monitor System (Nested Routes)
            {
                path: 'monitor',
                element: <MonitorLayout />,
                children: [
                    {
                        path: 'dashboard',
                        element: (
                            <ProtectedRoute requiredPermission="GET /api/monitor/metrics/dashboard" to="/admin">
                                <DashboardPage />
                            </ProtectedRoute>
                        ),
                    },
                    {
                        path: 'health',
                        element: (
                            <ProtectedRoute requiredPermission="GET /api/monitor/health/services" to="/admin">
                                <HealthPage />
                            </ProtectedRoute>
                        ),
                    },
                    {
                        path: 'metrics',
                        element: (
                            <ProtectedRoute requiredPermission="GET /api/monitor/metrics/cpu/{serviceName}" to="/admin">
                                <MetricsPage />
                            </ProtectedRoute>
                        ),
                    },
                ],
            },
        ],
    },


    // Auth Routes (Standalone)
    {
        path: '/auth',
        element: <AuthPage />,
    },
    {
        path: '/reset-password',
        element: <ResetPasswordPage />,
    },

    // Error Routes
    {
        path: '/404',
        element: <NotFoundPage />,
    },
    {
        path: '*',
        element: <Navigate to="/404" replace />,
    },
]);
