import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>ProtoThrive - Your AI Platform</title>
        <meta name="description" content="ProtoThrive - Advanced AI Platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">ProtoThrive</h1>
          <p className="text-xl text-gray-600 mb-8">Your platform is working!</p>
          <div className="space-y-4">
            <a 
              href="/admin-login" 
              className="block bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 transition-colors"
            >
              Admin Portal
            </a>
            <p className="text-sm text-gray-500">
              Backend: <a href="https://backend-thermo.ernijs-ansons.workers.dev" className="text-blue-500 hover:underline">https://backend-thermo.ernijs-ansons.workers.dev</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}