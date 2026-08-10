import { Flex } from '@radix-ui/themes';
import { getCachedSession } from '@/lib/auth0';
import AboutProblem from './_components/aboutProblem/AboutProblem';
import AboutService from './_components/aboutService/AboutService';
import Achievements from './_components/achievements/Achievements';
import { FirstView } from './_components/firstView/FirstView';
import { Footer } from './_components/footer/Footer';
import FooterTrialForm from './_components/footerTrialForm/FooterTrialForm';
import { Header } from './_components/header/Header';
import Information from './_components/information/Information';
import Search from './_components/search/Search';
import Solution from './_components/solution/Solution';
import { TopFooter } from './_components/topFooter/TopFooter';

export default async function Home() {
  const session = await getCachedSession();

  return (
    <Flex direction='column' style={{ backgroundColor: 'var(--bg-color-quaternary)' }}>
      <div
        style={{
          background:
            'linear-gradient(to bottom right, #eb7e3d1c 0%, #eb7e3d17 36%, #7cc3f714 70%, #7cc3f71c 100%)',
        }}
      >
        <div id='header'>
          <Header isLogin={!!session} />
        </div>
        <div id='firstView'>
          <FirstView />
        </div>
      </div>
      <div id='achievements'>
        <Achievements />
      </div>
      <div id='service'>
        <AboutService />
      </div>
      <div id='search'>
        <Search />
      </div>
      <div id='problem'>
        <AboutProblem />
      </div>
      <div id='solution'>
        <Solution />
      </div>
      {!session && (
        <>
          <div id='top_footer'>
            <TopFooter />
          </div>
          <div id='footer_form'>
            <FooterTrialForm />
          </div>
        </>
      )}
      <div id='information'>
        <Information />
      </div>

      <Footer />
    </Flex>
  );
}
