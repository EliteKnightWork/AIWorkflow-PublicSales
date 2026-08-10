import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import '@radix-ui/themes/styles.css';
import { GoogleTagManager } from '@next/third-parties/google';
import { Theme } from '@radix-ui/themes';
import Script from 'next/script';
import { BidPipelineProvider } from '@/context/BidPipelineContext';
import { CtaProvider } from '@/context/CtaContext';
import { SearchFilterPresetProvider } from '@/context/SearchFilterPresetContext';
import { ToastProvider } from '@/context/ToastContext';
import GAUserIdTracker from './_components/GAUserIdTracker/GAUserIdTracker';
import Provider from './provider';
import { ProjectReactionProvider } from '@/context/ProjectReactionContext';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title:
    'AI入札プラットフォームLabid（入札情報サービス） / 全国の自治体・官公庁の入札情報検索が可能',

  description:
    'AI入札情報サービスLabidは入札情報（入札案件、調達情報）や落札情報（落札結果、入札結果）の検索が可能です。全国の自治体・官公庁の情報を検索することが可能で、AIを活用したレコメンドやサマリにより情報収集や精査の工数を大幅に効率化します。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gtmId = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID || '';

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const isDevEnvironment = apiBaseUrl?.includes('localhost') || apiBaseUrl?.includes('dev');

  return (
    <html lang='ja'>
      <head>
        <link
          key='material-icons'
          href='https://fonts.googleapis.com/css2?display=swap&family=Material+Icons&family=Material+Icons+Outlined&family=Material+Icons+Two+Tone&family=Material+Icons+Round&family=Material+Icons+Sharp'
          rel='stylesheet'
          translate='no'
          lang='ja'
        />
        <link
          key='material-symbols-outlined'
          href='https://fonts.googleapis.com/css2?display=swap&family=Material+Symbols+Outlined:FILL@0..1'
          rel='stylesheet'
          translate='no'
          lang='ja'
        />

        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <meta httpEquiv='Content-Language' content='ja' />
        <meta name='google' content='notranslate' />

        {isDevEnvironment && <meta key='robots' name='robots' content='noindex' />}

        {/* GTMの初期化前にuser_idをdataLayerにプッシュするため、head内に配置 */}
        <GAUserIdTracker />

        {process.env.NODE_ENV === 'production' && (
          <Script key='microsoft-clarity' id='microsoft-clarity' strategy='afterInteractive'>
            {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "q18h0yc73l");
          `}
          </Script>
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Provider>
          <Theme appearance='light'>
            <CtaProvider>
              <ToastProvider>
                <ProjectReactionProvider>
                  <BidPipelineProvider>
                    <SearchFilterPresetProvider>{children}</SearchFilterPresetProvider>
                  </BidPipelineProvider>
                </ProjectReactionProvider>
              </ToastProvider>
            </CtaProvider>
          </Theme>
          {process.env.NODE_ENV === 'production' && <GoogleTagManager gtmId={gtmId} />}
        </Provider>
      </body>
    </html>
  );
}
