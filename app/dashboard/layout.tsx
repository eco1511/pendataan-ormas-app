import {requireSession} from '@/lib/auth';import DashboardShell from '@/components/layout/DashboardShell';
export default async function DashboardLayout({children}:{children:React.ReactNode}){await requireSession();return <DashboardShell>{children}</DashboardShell>}
