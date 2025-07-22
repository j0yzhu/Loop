import { Image } from 'react-native';
import { cn } from '~/lib/utils';

export const LoopLogo: React.FC<{ className?: string }> = ({ className }) => {
  return <Image source={require('~/assets/loopLogo.png')} className={cn('h-32 w-60', className)} />;
};
