import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ClientsPage from './pages/ClientsPage'
import SettingsPage from './pages/SettingsPage'
import CreateDocumentPage from './pages/CreateDocumentPage'
import DocumentDetailsPage from './pages/DocumentDetailsPage'
import ClientDetailsPage from './pages/ClientDetailsPage'
import CreatePurchaseDocumentPage from './pages/CreatePurchaseDocumentPage'
import PurchaseDetailsPage from './pages/PurchaseDetailsPage'
import SupplierDetailsPage from './pages/SupplierDetailsPage'
import SuppliersPage from './pages/SuppliersPage'
import ProductsPage from './pages/ProductsPage'
import SalesSection from './pages/SalesSection'
import PurchaseSection from './pages/PurchaseSection'
import TeamManagementPage from './pages/TeamManagementPage'
import ProfilePage from './pages/ProfilePage'
import ImportExportPage from './pages/ImportExportPage'
import SalariesPage from './pages/SalariesPage'
import EmployeeProfilePage from './pages/EmployeeProfilePage'
import CreateEmployeePage from './pages/CreateEmployeePage'
import UserActivityPage from './pages/UserActivityPage'
import ChatPage from './pages/ChatPage' // IMPORT PROPRE ICI

// Accountant Pages
import AccountantPortalPage from './pages/accountant/AccountantPortalPage'
import ClientDetailPage from './pages/accountant/ClientDetailPage'
import NewClientPage from './pages/accountant/NewClientPage'
import AcceptInvitationPage from './pages/accountant/AcceptInvitationPage'


// Layout
import DashboardLayout from './components/layouts/DashboardLayout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { user } = useAuthStore()
    return user ? <>{children}</> : <Navigate to="/login" />
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Standalone Routes (Full Screen) */}
                <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />

                {/* Dashboard Layout Routes */}
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <DashboardLayout />
                        </PrivateRoute>
                    }
                >
                    <Route index element={<DashboardPage />} />
                    <Route path="sales" element={<SalesSection />} />
                    <Route path="purchase" element={<PurchaseSection />} />
                    <Route path="purchase/create" element={<CreatePurchaseDocumentPage />} />
                    <Route path="purchase/:id" element={<PurchaseDetailsPage />} />
                    <Route path="purchase/:id/edit" element={<CreatePurchaseDocumentPage />} />
                    <Route path="salary" element={<SalariesPage />} />
                    <Route path="salary/new-employee" element={<CreateEmployeePage />} />
                    <Route path="employees/:id" element={<EmployeeProfilePage />} />
                    <Route path="clients" element={<ClientsPage />} />
                    <Route path="clients/:id" element={<ClientDetailsPage />} />
                    <Route path="suppliers" element={<SuppliersPage />} />
                    <Route path="suppliers/:id" element={<SupplierDetailsPage />} />
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="documents/create" element={<CreateDocumentPage />} />
                    <Route path="documents/:id" element={<DocumentDetailsPage />} />
                    <Route path="documents/:id/edit" element={<CreateDocumentPage />} />
                    <Route path="team" element={<TeamManagementPage />} />
                    <Route path="team/:id/activity" element={<UserActivityPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="import-export" element={<ImportExportPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Accountant Portal Routes */}
                <Route path="/portal/accountant" element={<PrivateRoute><AccountantPortalPage /></PrivateRoute>} />
                <Route path="/portal/accountant/new-client" element={<PrivateRoute><NewClientPage /></PrivateRoute>} />
                <Route path="/portal/accountant/clients/:clientId" element={<PrivateRoute><ClientDetailPage /></PrivateRoute>} />
                <Route path="/accountant/accept-invitation/:token" element={<PrivateRoute><AcceptInvitationPage /></PrivateRoute>} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
