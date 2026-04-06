import Navbar from '@/components/layout/Navbar';
import DashboardPage from '@/components/dashboard/DashboardPage';

export default function Dashboard() {
  return (
    <>
      <Navbar titre="Tableau de bord" />
      <main className="p-4 md:p-6">
        <DashboardPage />
      </main>
    </>
  );
}
