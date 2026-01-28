import { Link } from 'react-router-dom'
import { FileText, Shield, TrendingUp, Users, Check, ArrowRight } from 'lucide-react'

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <FileText className="w-8 h-8 text-primary-600" />
                            <span className="text-xl font-bold text-gray-900">Facturation TN</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="btn btn-secondary">
                                Connexion
                            </Link>
                            <Link to="/register" className="btn btn-primary">
                                Créer un compte
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-20 pb-32 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto animate-fade-in">
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            Facturation professionnelle
                            <span className="block text-primary-600 mt-2">conforme aux lois tunisiennes</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                            Solution complète de facturation pour les entreprises tunisiennes.
                            Gérez vos factures, devis et avoirs en toute conformité légale.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link to="/register" className="btn btn-primary text-lg px-8 py-3">
                                Commencer gratuitement
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link to="/login" className="btn btn-outline text-lg px-8 py-3">
                                Accéder à mon espace
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-4 bg-white">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">Pourquoi choisir notre solution ?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="card hover:shadow-lg transition-shadow animate-slide-up">
                            <Shield className="w-12 h-12 text-primary-600 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Conformité légale</h3>
                            <p className="text-gray-600">
                                Factures conformes à 100% aux exigences de la législation tunisienne.
                                Matricule fiscal, TVA, numérotation chronologique.
                            </p>
                        </div>

                        <div className="card hover:shadow-lg transition-shadow animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            <FileText className="w-12 h-12 text-primary-600 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Gestion complète</h3>
                            <p className="text-gray-600">
                                Factures, devis, avoirs. Multi-devises (TND, EUR, USD).
                                Génération PDF professionnelle instantanée.
                            </p>
                        </div>

                        <div className="card hover:shadow-lg transition-shadow animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <TrendingUp className="w-12 h-12 text-primary-600 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Simplicité d'usage</h3>
                            <p className="text-gray-600">
                                Interface moderne et intuitive. Créez vos factures en quelques clics.
                                Suivi en temps réel de votre activité.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold mb-6">Tout ce dont vous avez besoin</h2>
                            <ul className="space-y-4">
                                {[
                                    'Numérotation automatique et légale',
                                    'Gestion multi-devises avec taux de change',
                                    'Taux de TVA personnalisables (0%, 7%, 13%, 19%)',
                                    'Attributs personnalisés pour vos besoins',
                                    'Génération PDF conforme',
                                    'Historique et audit complet',
                                    'Multi-utilisateurs et rôles',
                                    'Sécurité et confidentialité garanties',
                                ].map((item, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-700">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-gradient-to-br from-primary-100 to-blue-100 rounded-2xl p-8 h-96 flex items-center justify-center">
                            <Users className="w-48 h-48 text-primary-600 opacity-20" />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4 bg-primary-600 text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-6">Prêt à simplifier votre facturation ?</h2>
                    <p className="text-xl mb-8 text-primary-100">
                        Rejoignez les entreprises tunisiennes qui font confiance à notre solution
                    </p>
                    <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3">
                        Créer mon compte gratuitement
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <FileText className="w-6 h-6" />
                        <span className="text-lg font-semibold text-white">Facturation TN</span>
                    </div>
                    <p className="text-sm">
                        © 2024 Facturation TN. Solution de facturation conforme aux lois tunisiennes.
                    </p>
                </div>
            </footer>
        </div>
    )
}
