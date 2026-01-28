import { ChevronRight, Globe, ShoppingBag, Video, Megaphone, Share2, PenTool, ExternalLink } from 'lucide-react';

export function AdSection() {
    const services = [
        {
            title: "Création Site Web",
            desc: "Solutions sur mesure et réalisation rapide.",
            icon: Globe,
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            title: "E-Commerce",
            desc: "Boostez vos ventes et atteignez vos objectifs.",
            icon: ShoppingBag,
            color: "text-emerald-600",
            bg: "bg-emerald-50"
        },
        {
            title: "Production",
            desc: "Vidéos publicitaires et séances photo.",
            icon: Video,
            color: "text-purple-600",
            bg: "bg-purple-50"
        },
        {
            title: "Réseaux Sociaux",
            desc: "Maximisez votre visibilité et votre engagement.",
            icon: Share2,
            color: "text-pink-600",
            bg: "bg-pink-50"
        },
        {
            title: "Campagne ADS",
            desc: "Résultats garantis selon vos objectifs.",
            icon: Megaphone,
            color: "text-orange-600",
            bg: "bg-orange-50"
        },
        {
            title: "Branding",
            desc: "Identité de marque et stratégies uniques.",
            icon: PenTool,
            color: "text-indigo-600",
            bg: "bg-indigo-50"
        }
    ];

    return (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-card border border-app shadow-xl group w-full transition-colors duration-300">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500 rounded-full blur-[100px] -mr-40 -mt-20 opacity-5"></div>

            <div className="relative p-8 lg:p-14">
                {/* Header with Agency Logo & Intro */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-10 mb-14 border-b border-app pb-12">
                    <div className="text-center lg:text-left space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-600/20 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em]">
                            Partenaire Croissance Digitale
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-app tracking-tight leading-none uppercase">
                            Propulsez votre <span className="text-blue-600">Entreprise</span>
                        </h2>
                        <p className="text-muted font-bold max-w-lg opacity-80">
                            Expertise créative et technologique au service de votre succès.
                            Découvrez les services de notre partenaire <strong className="text-app">DANA Creative Agency</strong>.
                        </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-center lg:items-end gap-4">
                        {/* Logo with slight filter for dark mode visibility if needed */}
                        <img
                            src="https://danacreativeagency.com/wp-content/uploads/2024/07/DANA-LOGO-copy.png"
                            alt="DANA Agency Logo"
                            className="h-20 w-auto object-contain hover:scale-105 transition-transform duration-500 cursor-pointer brightness-0 invert opacity-80 dark:opacity-100"
                            style={{ filter: 'var(--logo-filter, none)' }}
                            onClick={() => window.open('https://danacreativeagency.com/', '_blank')}
                        />
                        <button
                            onClick={() => window.open('https://danacreativeagency.com/contact/', '_blank')}
                            className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest hover:underline"
                        >
                            Contacter l'agence <ExternalLink className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Services Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service, index) => (
                        <div
                            key={index}
                            className="group/card flex flex-col p-6 rounded-3xl bg-app border border-app hover:border-blue-600 transition-all duration-300"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`${service.bg} ${service.color} w-12 h-12 rounded-xl flex items-center justify-center shadow-sm opacity-80 group-hover/card:opacity-100`}>
                                    <service.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-app font-black text-xs uppercase tracking-widest">
                                    {service.title}
                                </h3>
                            </div>
                            <p className="text-muted text-[10px] font-black leading-relaxed mb-6 uppercase opacity-60">
                                {service.desc}
                            </p>
                            <div className="mt-auto flex items-center gap-2 text-blue-600 text-[9px] font-black uppercase tracking-widest opacity-0 group-hover/card:opacity-100 transition-opacity">
                                Découvrir <ChevronRight className="w-3 h-3" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Simplified & Elegant Footer Footer */}
                <div className="mt-12 pt-8 flex flex-col items-center border-t border-app">
                    <button
                        onClick={() => window.open('https://danacreativeagency.com/services/', '_blank')}
                        className="px-10 py-4 bg-app text-app border border-app rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:scale-[1.02] transition-all active:scale-95 shadow-xl"
                    >
                        Accéder aux services officiels
                    </button>
                    <p className="mt-6 text-muted text-[9px] font-black uppercase tracking-[0.5em] opacity-40">Expérience • Technologie • Créativité</p>
                </div>
            </div>
        </div>
    );
}
