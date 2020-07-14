import {
  NavigationScreenProp,
  NavigationRoute,
  NavigationContext,
  NavigationParams,
  NavigationEventSubscription,
  NavigationEventCallback
} from 'react-navigation';
import { useContext, useRef, useEffect } from 'react';

type Nav<T> = NavigationScreenProp<NavigationRoute<NavigationParams>, T>;
type EventName = 'willBlur' | 'willFocus' | 'didFocus' | 'didBlur';

const useNavigation = <TParams>(): Nav<TParams> =>
  useContext(NavigationContext) as Nav<TParams>;

const useNavigationEffect = (
  navigation: Nav<{}>,
  eventName: EventName,
  fn: NavigationEventCallback
) => {
  const listener = useRef<NavigationEventSubscription>();

  useEffect(() => {
    listener.current = navigation.addListener(eventName, fn);
    return () => {
      const { current } = listener;
      if (current) {
        current.remove();
      }
    };
  }, []);
};

export { useNavigation, useNavigationEffect };
