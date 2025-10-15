import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-pink-light via-purple-100 to-pink-light py-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center">
            <h1 className="font-display text-5xl font-bold text-purple-deep mb-6 md:text-6xl">
              Selamat Datang di <br className="md:hidden" />
              <span className="text-pink-primary">Cadoobag</span>
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Koleksi Tas Wanita Berkualitas Premium dengan Desain Modern dan Elegan
            </p>
            <Link
              href={ROUTES.PRODUCTS}
              className="inline-flex items-center justify-center rounded-2xl bg-pink-primary px-8 py-4 text-lg font-semibold text-white hover:opacity-90 transition-opacity shadow-lg"
            >
              Jelajahi Koleksi
              <svg
                className="ml-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto max-w-7xl px-4">
          <h2 className="font-display text-3xl font-bold text-purple-deep mb-8 text-center">
            Kategori Populer
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {['Tote', 'Shoulder', 'Crossbody', 'Backpack', 'Clutch'].map((category) => (
              <Link
                key={category}
                href={`${ROUTES.PRODUCTS}?category=${category.toLowerCase()}`}
                className="group relative overflow-hidden rounded-xl bg-gray-100 p-6 text-center hover:bg-pink-light transition-colors"
              >
                <div className="mb-3">
                  <svg
                    className="mx-auto h-12 w-12 text-pink-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-pink-primary transition-colors">
                  {category}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-bg">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-primary/10">
                <svg
                  className="h-8 w-8 text-pink-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">Kualitas Premium</h3>
              <p className="text-sm text-gray-600">
                Material berkualitas tinggi dan jahitan rapi
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-primary/10">
                <svg
                  className="h-8 w-8 text-pink-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">Pengiriman Cepat</h3>
              <p className="text-sm text-gray-600">
                Dikirim dalam 1-2 hari kerja ke seluruh Indonesia
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-primary/10">
                <svg
                  className="h-8 w-8 text-pink-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">Pembayaran Aman</h3>
              <p className="text-sm text-gray-600">
                Berbagai metode pembayaran yang aman dan terpercaya
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
