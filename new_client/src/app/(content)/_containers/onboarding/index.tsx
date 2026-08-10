import { OnboardingContainer } from './container';

type Props = {
  redirectPath: string;
};

export default function Onboarding({ redirectPath }: Props) {
  return <OnboardingContainer redirectPath={redirectPath} />;
}
